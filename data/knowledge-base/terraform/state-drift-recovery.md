# Terraform state drift and recovery playbook

## Symptoms of drift
- `terraform plan` shows unexpected deletions/creates for live infrastructure you did not change.
- CI plans differ from local plans because back-end state files diverged.
- Resources created outside Terraform (manual console changes) appear as new or tainted resources.

## Immediate containment
- Enable state file locking (S3 + DynamoDB) and verify only one plan/apply is running.
- Capture the current remote state (`terraform state pull > state-backup-$(date +%Y%m%d).json`).
- Snapshot provider credentials used by automation to rule out cross-account or role mis-assumptions.

## Drift investigation checklist
1. **State backend integrity**
   - Ensure the bucket versioning is on and the DynamoDB lock table is healthy (no stale locks).
   - Confirm CI jobs write to the correct state key; look for branch-specific keys that accidentally apply to prod.
2. **Out-of-band changes**
   - Compare resource timestamps to deployment history; look for console edits or emergency scripts.
   - Use `terraform import` candidates for resources that should remain managed.
3. **Module or provider upgrades**
   - Breaking changes that rename resources or change defaults can look like drift; pin versions and review changelogs.
4. **Partial applies**
   - Failed applies may leave resources created but state not updated; rerun `terraform apply -refresh-only` to reconcile.

## Recovery paths
- **Refresh-only apply**: `terraform apply -refresh-only` to sync observed infrastructure into state without changing live resources.
- **Targeted import**: For out-of-band resources that should be managed, `terraform import` followed by a plan to confirm parity.
- **Manual state surgery (last resort)**: Use `terraform state rm/mv` to detach or rename resources when module paths change; document every command.
- **Rollback**: If a bad module release caused churn, pin the previous version and re-apply to restore the known-good topology.

## Preventing recurrence
- Enforce `-lock-timeout` and `-input=false` in CI so operators do not bypass locks interactively.
- Add drift detection jobs that run `terraform plan -detailed-exitcode` on a schedule and alert on exit code 2.
- Require change controls for console edits in production accounts; record JIRA/incident IDs in state change logs.
- Maintain environment-specific state buckets/keys to isolate blast radius between sandboxes, staging, and production.

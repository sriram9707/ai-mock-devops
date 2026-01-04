---
id: cloudformation-drift-detection
tags: [auto-tagged]
---

# AWS CloudFormation: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on AWS CloudFormation. Focus on practical implementation, troubleshooting, and enterprise patterns.

---

## How to Use This Document

- **Entry Level:** Focus on basic template structure, resources, and simple stacks.
- **Senior/Medior:** Focus on nested stacks, cross-stack references, and troubleshooting.
- **SRE/Architect:** Focus on StackSets, drift detection, and organizational patterns.

---

## Core Concepts: Template Structure

### Basic Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Web application infrastructure

Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
    Default: dev
  InstanceType:
    Type: String
    Default: t3.micro

Mappings:
  RegionAMI:
    us-east-1:
      AMI: ami-0123456789abcdef0
    us-west-2:
      AMI: ami-0fedcba9876543210

Conditions:
  IsProd: !Equals [!Ref Environment, prod]

Resources:
  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
      InstanceType: !If [IsProd, t3.large, !Ref InstanceType]
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-web-server'

Outputs:
  InstanceId:
    Value: !Ref WebServer
    Export:
      Name: !Sub '${Environment}-WebServerInstanceId'
```

### What Entry Level Should Know
- Template sections (Parameters, Resources, Outputs)
- Basic intrinsic functions (!Ref, !Sub)
- How to create and update stacks
- What happens during stack creation

### What Senior Level Should Know
- All intrinsic functions
- Nested stacks and cross-stack references
- Change sets and drift detection
- Custom resources
- Stack policies

### What SRE Should Know
- StackSets for multi-account/region
- Service Catalog integration
- Macros and transforms
- CI/CD integration patterns
- Compliance and governance

---

## Scenario Pattern: Stack Failures

### Incident: Stack Creation Fails and Rolls Back

**What's happening:** Stack creation fails, CloudFormation rolls back, and you lose visibility into what went wrong.

**Debugging:**
```bash
# Get stack events
aws cloudformation describe-stack-events --stack-name my-stack

# Look for FAILED status
aws cloudformation describe-stack-events --stack-name my-stack \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Disable rollback for debugging (not for prod!)
aws cloudformation create-stack --stack-name my-stack \
  --template-body file://template.yaml \
  --disable-rollback
```

**Natural follow-up directions:**

If candidate checks events → "Events show 'Resource creation cancelled' for most resources but no clear error. How do you find the root cause?"
- Expected: Look for the first CREATE_FAILED event (chronologically), that's usually the root cause. Others fail because of dependency.

If candidate mentions `--disable-rollback` → "When would you use this and what are the risks?"
- Expected: Only for debugging in non-prod. Risk: leaves partial resources that might incur costs or cause confusion. Must clean up manually.

### Incident: Stack Update Fails Halfway

**What's happening:** Update was applying, some resources updated, then it failed and rolled back.

**Key concept:** CloudFormation updates can be:
- **No interruption:** Update in place
- **Some interruption:** Brief downtime
- **Replacement:** Delete and recreate resource

**Natural follow-up directions:**

If candidate mentions "replacement" → "You updated a security group and CloudFormation wants to replace an EC2 instance. Why?"
- Expected: EC2 instance references the security group. Some changes require replacement. Check "Update requires" in documentation.

If candidate mentions "change sets" → "How do change sets help prevent this?"
- Expected: Preview changes before applying, see which resources will be replaced, review and approve before execution.

---

## Scenario Pattern: Circular Dependencies

### Incident: Template Fails with "Circular dependency" Error

**What's happening:** CloudFormation can't determine resource creation order.

**Example problem:**
```yaml
# Security group references EC2 instance
# EC2 instance references security group
# = Circular dependency

Resources:
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      SecurityGroupIngress:
        - SourceSecurityGroupId: !GetAtt Instance.SecurityGroups[0]  # Problem!
  
  Instance:
    Type: AWS::EC2::Instance
    Properties:
      SecurityGroupIds:
        - !Ref SecurityGroup
```

**Solution:**
```yaml
Resources:
  SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Web server SG
  
  SecurityGroupIngress:
    Type: AWS::EC2::SecurityGroupIngress
    Properties:
      GroupId: !Ref SecurityGroup
      SourceSecurityGroupId: !Ref SecurityGroup
      IpProtocol: tcp
      FromPort: 443
      ToPort: 443
  
  Instance:
    Type: AWS::EC2::Instance
    Properties:
      SecurityGroupIds:
        - !Ref SecurityGroup
```

**Natural follow-up directions:**

If candidate identifies the circular dependency → "How do you generally avoid circular dependencies in CloudFormation?"
- Expected: Use separate resources for ingress/egress rules, use DependsOn carefully, sometimes split into multiple stacks

---

## Scenario Pattern: Cross-Stack References

### Incident: Need to Share Resources Between Stacks

**What's happening:** Network team manages VPC stack, application team needs VPC ID for their stack.

**Export from VPC stack:**
```yaml
Outputs:
  VpcId:
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'
  
  PrivateSubnets:
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnets'
```

**Import in application stack:**
```yaml
Resources:
  AppInstance:
    Type: AWS::EC2::Instance
    Properties:
      SubnetId: !Select [0, !Split [',', !ImportValue 'vpc-stack-PrivateSubnets']]
```

**Natural follow-up directions:**

If candidate uses exports → "What happens if you try to delete the VPC stack while the app stack exists?"
- Expected: CloudFormation prevents deletion because of the export dependency. Must delete dependent stacks first or remove the import.

If candidate mentions "coupling" → "What are alternatives to cross-stack references for loose coupling?"
- Expected: SSM Parameter Store, Secrets Manager, or pass values through CI/CD pipeline. Discuss trade-offs.

---

## Scenario Pattern: StackSets for Multi-Account

### Incident: Need Same Infrastructure in 50 AWS Accounts

**What's happening:** Organization wants consistent security baseline across all accounts.

**StackSet structure:**
```yaml
# stackset.yaml - deployed to all accounts
Resources:
  SecurityBaseline:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: s3-bucket-public-read-prohibited
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_PUBLIC_READ_PROHIBITED
```

**Deployment:**
```bash
aws cloudformation create-stack-set \
  --stack-set-name security-baseline \
  --template-body file://stackset.yaml \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false

aws cloudformation create-stack-instances \
  --stack-set-name security-baseline \
  --deployment-targets OrganizationalUnitIds=ou-xxxx-xxxxxxxx \
  --regions us-east-1 us-west-2
```

**Natural follow-up directions:**

If candidate mentions StackSets → "A StackSet update failed in 5 out of 50 accounts. How do you handle this?"
- Expected: Check failure reasons per account, might be permission issues, resource limits, or region-specific problems. Can retry failed instances.

If candidate mentions "drift" → "How do you detect and handle drift across 50 accounts?"
- Expected: StackSet drift detection, AWS Config rules, regular audits. Discuss remediation strategies.

---

## Scenario Pattern: Drift Detection

### Incident: Resources Don't Match Template

**What's happening:** Someone made manual changes in the console, now CloudFormation state doesn't match reality.

**Detection:**
```bash
# Initiate drift detection
aws cloudformation detect-stack-drift --stack-name my-stack

# Check drift status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <detection-id>

# Get drift details
aws cloudformation describe-stack-resource-drifts \
  --stack-name my-stack \
  --stack-resource-drift-status-filters MODIFIED DELETED
```

**Natural follow-up directions:**

If candidate detects drift → "You found drift on a security group—someone added an ingress rule manually. How do you remediate?"
- Expected: Options: 1) Update template to match and update stack, 2) Update stack to revert manual change, 3) Import the change into template. Discuss which is appropriate.

If candidate mentions "prevention" → "How do you prevent drift in the first place?"
- Expected: IAM policies restricting console access, AWS Config rules, SCPs, education, CI/CD only deployments

---

## Handy CloudFormation Patterns

### Intrinsic Functions
```yaml
# Reference
!Ref MyResource

# Get Attribute
!GetAtt MyResource.Arn

# Substitute
!Sub 'arn:aws:s3:::${BucketName}/*'

# Join
!Join ['-', [!Ref Environment, 'bucket']]

# Split and Select
!Select [0, !Split [',', !Ref SubnetList]]

# If condition
!If [IsProd, t3.large, t3.micro]

# FindInMap
!FindInMap [RegionAMI, !Ref 'AWS::Region', AMI]
```

### DependsOn (Explicit Dependencies)
```yaml
Resources:
  Database:
    Type: AWS::RDS::DBInstance
    # ...
  
  Application:
    Type: AWS::EC2::Instance
    DependsOn: Database  # Wait for DB before creating instance
```

### Custom Resources (Lambda-backed)
```yaml
Resources:
  CustomFunction:
    Type: AWS::Lambda::Function
    Properties:
      # Lambda that does custom logic
  
  CustomResource:
    Type: Custom::MyCustomResource
    Properties:
      ServiceToken: !GetAtt CustomFunction.Arn
      CustomProperty: some-value
```

### Stack Policy (Prevent Updates)
```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "Update:Replace",
      "Principal": "*",
      "Resource": "LogicalResourceId/ProductionDatabase"
    }
  ]
}
```

---

## Level-Specific Conversation Starters

### Entry Level
"Walk me through what happens when you create a CloudFormation stack."
- Listen for: Template validation, resource creation order, rollback on failure
- Follow up on: What if one resource fails? How do you troubleshoot?

### Senior Level
"Your application stack depends on a VPC stack managed by another team. How do you handle this dependency?"
- Listen for: Cross-stack references, exports/imports, alternatives
- Follow up on: What if the VPC stack needs to be updated? How do you handle breaking changes?

### SRE Level
"Design a CloudFormation strategy for deploying security baselines across 200 AWS accounts in an organization."
- Listen for: StackSets, Organizations integration, drift detection, compliance
- Follow up on: How do you handle account-specific exceptions? How do you roll out updates safely?

---

## Red Flags vs Green Flags

### Red Flags
- Doesn't use parameters (hardcodes values)
- No understanding of update behaviors (replacement vs in-place)
- "Just delete and recreate the stack"
- Ignores drift
- No change set review before updates

### Green Flags
- Uses change sets for all updates
- Understands cross-stack references and their implications
- Has a drift detection and remediation strategy
- Uses nested stacks or StackSets appropriately
- Considers rollback scenarios
- Mentions stack policies for critical resources
- Integrates CloudFormation with CI/CD

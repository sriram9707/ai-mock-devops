---
id: linux-networking-basics
tags: [auto-tagged]
---

# Linux Networking: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on Linux networking. Focus on practical troubleshooting and understanding of network fundamentals.

---

## How to Use This Document

- **Entry Level:** Focus on basic commands, understanding of IP/ports, and simple connectivity troubleshooting.
- **Senior/Medior:** Focus on complex network debugging, firewall rules, and performance issues.
- **SRE/Architect:** Focus on network design, security, and high-availability architectures.

---

## Core Concepts: TCP/IP Fundamentals

### The Network Stack

**Layer Model (simplified for interviews):**
- **Application Layer:** HTTP, DNS, SSH—what the app sees
- **Transport Layer:** TCP (reliable), UDP (fast)—ports live here
- **Network Layer:** IP addressing, routing—how packets find their destination
- **Link Layer:** Ethernet, MAC addresses—local network delivery

### What Entry Level Should Know
- IP addresses and subnets (what /24 means)
- Difference between TCP and UDP
- Common ports (22, 80, 443, 3306, 5432)
- Basic commands: `ping`, `curl`, `telnet`

### What Senior Level Should Know
- TCP handshake and connection states
- How DNS resolution works end-to-end
- NAT and how it affects connectivity
- Firewall concepts (iptables basics)

### What SRE Should Know
- TCP tuning parameters
- Network performance analysis
- Load balancing algorithms
- Network security architecture

---

## Scenario Pattern: Connectivity Issues

### Incident: Application Can't Connect to Database

**What's happening:** App logs show "connection refused" or "connection timed out" to database.

**Debugging flow:**
```bash
# Test basic connectivity
ping <db-host>                           # ICMP reachability
telnet <db-host> 5432                    # TCP port check
nc -zv <db-host> 5432                    # Netcat port check
curl -v telnet://<db-host>:5432          # Another way

# Check DNS
nslookup <db-host>
dig <db-host>
cat /etc/resolv.conf                     # DNS servers configured

# Check local firewall
iptables -L -n                           # List rules
firewall-cmd --list-all                  # If using firewalld

# Check if service is listening
ss -tlnp | grep 5432                     # On the DB server
netstat -tlnp | grep 5432                # Alternative
```

**Natural follow-up directions:**

If candidate pings successfully → "Ping works but telnet to port 5432 times out. What are the possible causes?"
- Expected: Firewall blocking the port (local, remote, or network), service not listening, service bound to localhost only

If candidate checks firewall → "Local firewall is open. How do you check if there's a network firewall in the path?"
- Expected: traceroute to see the path, check with network team, try from different source, check security groups (cloud)

If candidate mentions "connection refused" vs "timeout" → "What's the difference between these two errors?"
- Expected: Refused = reached the host but port is closed. Timeout = packet didn't get response (firewall drop, host down, routing issue)

### Incident: Intermittent Connection Drops

**What's happening:** Connections work sometimes but randomly fail or drop mid-session.

**Debugging flow:**
```bash
# Check for packet loss
ping -c 100 <host>                       # Look at packet loss %
mtr <host>                               # Continuous traceroute with stats

# Check connection states
ss -s                                    # Socket statistics summary
netstat -an | awk '/tcp/ {print $6}' | sort | uniq -c  # Connection state counts

# Check for errors
ip -s link                               # Interface statistics (errors, drops)
ethtool -S eth0                          # Detailed NIC stats
dmesg | grep -i eth                      # Kernel messages about network
```

**Natural follow-up directions:**

If candidate uses `mtr` → "mtr shows 20% packet loss at hop 5. What do you do with this information?"
- Expected: Identify whose infrastructure hop 5 is, could be ICMP deprioritization (not real loss), compare with TCP traffic, escalate to network team

If candidate checks interface stats → "You see a high number of RX errors. What could cause this?"
- Expected: Cable issues, NIC problems, duplex mismatch, driver issues, network congestion

---

## Scenario Pattern: DNS Issues

### Incident: DNS Resolution Failing

**What's happening:** Applications can't resolve hostnames. "Name or service not known" errors.

**Debugging flow:**
```bash
# Test resolution
nslookup example.com
dig example.com
dig @8.8.8.8 example.com                 # Test with specific DNS server
host example.com

# Check configuration
cat /etc/resolv.conf                     # DNS servers
cat /etc/nsswitch.conf                   # Name resolution order
cat /etc/hosts                           # Local overrides

# Check DNS service
systemctl status systemd-resolved        # If using systemd-resolved
resolvectl status                        # Detailed resolver status
```

**Natural follow-up directions:**

If candidate checks resolv.conf → "resolv.conf looks correct but resolution still fails. What else?"
- Expected: DNS server might be unreachable (firewall), DNS server might be overloaded, check if it's all domains or specific ones

If candidate mentions "works with IP but not hostname" → "The app works when you use IP directly. What does this tell you?"
- Expected: Confirms it's a DNS issue, not a connectivity issue. Check DNS configuration, caching, TTL issues.

If candidate uses `dig @8.8.8.8` → "Resolution works with 8.8.8.8 but not with your internal DNS. What's the issue?"
- Expected: Internal DNS server problem—check if it's running, check its upstream forwarders, check if it has the record

### Incident: DNS Resolution Slow

**What's happening:** DNS works but takes several seconds, causing application slowness.

**Debugging flow:**
```bash
# Measure resolution time
time dig example.com
dig example.com | grep "Query time"

# Check for timeouts
strace -e network curl http://example.com 2>&1 | grep -i dns

# Check DNS server response time
dig @<dns-server> example.com | grep "Query time"
```

**Natural follow-up directions:**

If candidate identifies slow DNS server → "Your primary DNS is slow. How do you fix this without changing the server?"
- Expected: Add faster secondary DNS, implement local caching (dnsmasq, systemd-resolved), increase resolver timeout

If candidate mentions caching → "How does DNS caching work and how do you clear it?"
- Expected: TTL-based caching, `systemd-resolve --flush-caches`, browser cache, application-level caching

---

## Scenario Pattern: Firewall Issues

### Incident: New Service Not Accessible

**What's happening:** You deployed a new service on port 8080 but external clients can't reach it.

**Debugging flow:**
```bash
# Verify service is listening
ss -tlnp | grep 8080
curl localhost:8080                      # Test locally

# Check iptables
iptables -L -n -v                        # List with packet counts
iptables -L INPUT -n --line-numbers      # Input chain with line numbers

# Check firewalld (if used)
firewall-cmd --list-all
firewall-cmd --list-ports

# Check SELinux (if enabled)
getenforce
semanage port -l | grep 8080
```

**Natural follow-up directions:**

If candidate checks iptables → "You see a DROP rule for port 8080. How do you add an allow rule?"
- Expected: `iptables -I INPUT -p tcp --dport 8080 -j ACCEPT`, discuss rule ordering, mention persistence (`iptables-save`)

If candidate mentions cloud → "This is an EC2 instance. iptables shows no blocking rules. What else?"
- Expected: Security Groups, NACLs, check both inbound rules, verify the security group is attached to the instance

If candidate fixes firewall but still doesn't work → "Firewall is open, service is listening on 0.0.0.0:8080, but still can't connect. What else?"
- Expected: Service might be listening on wrong interface, NAT issues, routing issues, check if there's a load balancer in front

---

## Scenario Pattern: Network Performance

### Incident: High Network Latency

**What's happening:** Network operations are slow. High ping times or slow data transfer.

**Debugging flow:**
```bash
# Measure latency
ping -c 10 <host>                        # Basic latency
mtr -r -c 100 <host>                     # Path analysis

# Check bandwidth
iperf3 -c <host>                         # Bandwidth test (need iperf server)
curl -o /dev/null -w "%{speed_download}" http://<host>/largefile

# Check for congestion
ss -ti                                   # TCP info (cwnd, rtt)
netstat -s | grep -i retrans             # Retransmissions
```

**Natural follow-up directions:**

If candidate uses `mtr` → "Latency is fine until the last hop where it jumps from 5ms to 200ms. What does this mean?"
- Expected: The destination server or its local network is the bottleneck. Could be server overload, local network congestion, or the server deprioritizing ICMP.

If candidate mentions retransmissions → "You see high TCP retransmissions. What causes this and how do you fix it?"
- Expected: Packet loss somewhere in the path, congestion, faulty hardware. Fix depends on cause—might need network team, might be server-side tuning.

---

## Handy Commands Quick Reference

### Connectivity Testing
```bash
ping <host>                              # ICMP echo
traceroute <host>                        # Path tracing
mtr <host>                               # Continuous traceroute
telnet <host> <port>                     # TCP port test
nc -zv <host> <port>                     # Netcat port scan
curl -v http://<host>                    # HTTP with verbose
```

### DNS
```bash
nslookup <domain>                        # Simple lookup
dig <domain>                             # Detailed lookup
dig +short <domain>                      # Just the answer
dig @<server> <domain>                   # Query specific server
host <domain>                            # Another lookup tool
resolvectl query <domain>                # systemd-resolved
```

### Socket/Connection Analysis
```bash
ss -tlnp                                 # TCP listening sockets
ss -tanp                                 # All TCP connections
ss -s                                    # Socket summary
netstat -an                              # All connections
lsof -i :<port>                          # What's using a port
```

### Packet Capture
```bash
tcpdump -i eth0                          # Capture all on interface
tcpdump -i eth0 port 80                  # Filter by port
tcpdump -i eth0 host 10.0.0.1            # Filter by host
tcpdump -i eth0 -w capture.pcap          # Write to file
tcpdump -r capture.pcap                  # Read from file
```

### Firewall
```bash
iptables -L -n -v                        # List rules with counts
iptables -I INPUT -p tcp --dport 80 -j ACCEPT  # Add rule
iptables-save > /etc/iptables.rules      # Save rules
firewall-cmd --list-all                  # firewalld status
ufw status                               # Ubuntu firewall
```

---

## Level-Specific Conversation Starters

### Entry Level
"A user reports they can't access your web application. How do you start troubleshooting?"
- Listen for: Basic connectivity checks, understanding of client vs server side
- Follow up on: What commands would you use? What's the difference between connection refused and timeout?

### Senior Level
"Your application experiences intermittent timeouts when connecting to an external API. The API provider says their service is fine. How do you investigate?"
- Listen for: Systematic approach, network path analysis, considering multiple failure points
- Follow up on: How do you capture evidence? How do you prove it's not your side?

### SRE Level
"Design the network architecture for a high-availability web application that needs to handle 100k requests per second with sub-100ms latency."
- Listen for: Load balancing, CDN, connection pooling, geographic distribution
- Follow up on: How do you handle DDoS? What about failover between regions?

---

## Red Flags vs Green Flags

### Red Flags
- Only knows `ping` for network troubleshooting
- Doesn't understand the difference between TCP and UDP
- Can't explain what a firewall does
- "It works on my machine" without investigating further
- No understanding of DNS beyond "it translates names to IPs"

### Green Flags
- Systematic approach: connectivity → DNS → firewall → application
- Understands TCP connection states and what they mean
- Can use `tcpdump` or knows when packet capture is needed
- Considers the full network path (client → network → server)
- Mentions security implications when opening firewall ports
- Knows the difference between "connection refused" and "timeout"

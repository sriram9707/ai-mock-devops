# Cloud Services Targeted During Interviews

## Overview
The interview system dynamically detects and targets cloud services based on:
1. **Candidate's mentioned technologies** (from their introduction)
2. **Job Description requirements** (if provided)
3. **Cloud Provider** (AWS, GCP, or Azure)

## AWS Services Targeted

### Compute Services
- **EC2** - Elastic Compute Cloud (virtual machines)
- **Lambda** - Serverless functions
- **ECS** - Elastic Container Service
- **EKS** - Elastic Kubernetes Service
- **Fargate** - Serverless containers
- **Batch** - Batch computing
- **Lightsail** - Simplified VPS

### Storage Services
- **S3** - Simple Storage Service (object storage)
- **EBS** - Elastic Block Store (block storage)
- **EFS** - Elastic File System (managed NFS)
- **FSx** - Managed file systems
- **Glacier** - Archive storage
- **Storage Gateway** - Hybrid storage

### Database Services
- **RDS** - Relational Database Service (MySQL, PostgreSQL, etc.)
- **Aurora** - High-performance database
- **DynamoDB** - NoSQL database
- **Redshift** - Data warehouse
- **ElastiCache** - In-memory caching (Redis/Memcached)
- **DocumentDB** - MongoDB-compatible
- **Neptune** - Graph database
- **Timestream** - Time-series database

### Networking Services
- **VPC** - Virtual Private Cloud
- **ALB** - Application Load Balancer
- **NLB** - Network Load Balancer
- **CLB** - Classic Load Balancer
- **CloudFront** - CDN
- **Route53** - DNS service
- **API Gateway** - API management
- **Direct Connect** - Dedicated network connection
- **VPN** - Virtual Private Network
- **Transit Gateway** - Network transit hub

### Security Services
- **IAM** - Identity and Access Management
- **Cognito** - User authentication
- **Secrets Manager** - Secrets management
- **KMS** - Key Management Service
- **WAF** - Web Application Firewall
- **Shield** - DDoS protection
- **GuardDuty** - Threat detection
- **Security Hub** - Security posture management

### Monitoring & Management
- **CloudWatch** - Monitoring and observability
- **CloudTrail** - Audit logging
- **Config** - Configuration management
- **Systems Manager** - Operations management
- **OpsWorks** - Configuration management
- **CloudFormation** - Infrastructure as Code

### Application Integration
- **SNS** - Simple Notification Service
- **SQS** - Simple Queue Service
- **EventBridge** - Event-driven architecture
- **Step Functions** - Workflow orchestration
- **AppSync** - GraphQL API
- **MQ** - Message broker

### Analytics Services
- **Kinesis** - Real-time streaming
- **EMR** - Big data processing
- **Athena** - Query S3 data
- **QuickSight** - Business intelligence
- **Glue** - ETL service
- **Data Pipeline** - Data workflows

### Developer Tools
- **CodeCommit** - Source control
- **CodeBuild** - Build service
- **CodeDeploy** - Deployment service
- **CodePipeline** - CI/CD pipelines
- **X-Ray** - Distributed tracing

### Container Services
- **ECR** - Elastic Container Registry
- **ECS** - Elastic Container Service
- **EKS** - Elastic Kubernetes Service

---

## GCP Services Targeted

### Compute Services
- **Compute Engine (GCE)** - Virtual machines
- **GKE** - Google Kubernetes Engine
- **Cloud Run** - Serverless containers
- **Cloud Functions** - Serverless functions
- **App Engine** - Platform as a Service
- **Cloud Batch** - Batch computing

### Storage Services
- **Cloud Storage (GCS)** - Object storage
- **Persistent Disk** - Block storage
- **Filestore** - Managed file storage
- **Cloud Storage for Firebase** - Mobile/web storage

### Database Services
- **Cloud SQL** - Managed SQL databases
- **Spanner** - Globally distributed database
- **Firestore** - NoSQL database
- **Bigtable** - NoSQL wide-column database
- **BigQuery** - Data warehouse
- **Memorystore** - In-memory caching (Redis/Memcached)

### Networking Services
- **VPC** - Virtual Private Cloud
- **Cloud Load Balancing** - Load balancing
- **Cloud CDN** - Content delivery network
- **Cloud DNS** - DNS service
- **Cloud Interconnect** - Dedicated network
- **Cloud VPN** - VPN service
- **Cloud Armor** - DDoS protection and WAF

### Security Services
- **Cloud IAM** - Identity and Access Management
- **Cloud Identity** - Identity management
- **Secret Manager** - Secrets management
- **Cloud KMS** - Key management
- **Cloud Security Command Center** - Security posture

### Monitoring & Management
- **Cloud Monitoring** - Monitoring and alerting
- **Cloud Logging** - Log management
- **Cloud Trace** - Distributed tracing
- **Cloud Debugger** - Debugging
- **Cloud Profiler** - Performance profiling
- **Cloud Deployment Manager** - Infrastructure as Code

### Application Integration
- **Pub/Sub** - Messaging service
- **Cloud Tasks** - Task queue
- **Cloud Scheduler** - Job scheduling
- **Cloud Endpoints** - API management
- **Apigee** - API platform

### Analytics Services
- **Dataflow** - Stream and batch processing
- **Dataproc** - Managed Spark/Hadoop
- **Dataprep** - Data preparation
- **Data Fusion** - Data integration
- **BigQuery** - Data warehouse
- **Cloud Composer** - Workflow orchestration (Airflow)

### Developer Tools
- **Cloud Build** - CI/CD pipelines
- **Cloud Source Repositories** - Source control
- **Artifact Registry** - Container/artifact storage
- **Cloud Code** - IDE plugins

---

## Azure Services Targeted

### Compute Services
- **Virtual Machines (VM)** - Virtual machines
- **AKS** - Azure Kubernetes Service
- **Container Instances** - Serverless containers
- **App Service** - Platform as a Service
- **Azure Functions** - Serverless functions
- **Batch** - Batch computing
- **Service Fabric** - Microservices platform

### Storage Services
- **Blob Storage** - Object storage
- **File Storage** - File shares
- **Queue Storage** - Message queues
- **Table Storage** - NoSQL storage
- **Disk Storage** - Managed disks
- **Azure Files** - Managed file shares
- **Azure NetApp Files** - Enterprise file storage

### Database Services
- **SQL Database** - Managed SQL database
- **Cosmos DB** - Globally distributed NoSQL
- **Database for MySQL** - Managed MySQL
- **Database for PostgreSQL** - Managed PostgreSQL
- **Database for MariaDB** - Managed MariaDB
- **SQL Data Warehouse** - Data warehouse
- **Azure Cache for Redis** - In-memory caching

### Networking Services
- **Virtual Network (VNet)** - Virtual networking
- **Load Balancer** - Load balancing
- **Application Gateway** - Application load balancer
- **Front Door** - Global CDN and WAF
- **CDN** - Content delivery network
- **DNS** - DNS service
- **ExpressRoute** - Dedicated network
- **VPN Gateway** - VPN service
- **Traffic Manager** - DNS-based load balancing

### Security Services
- **Active Directory** - Identity management
- **Key Vault** - Secrets management
- **Security Center** - Security posture
- **Sentinel** - SIEM
- **DDoS Protection** - DDoS protection
- **WAF** - Web Application Firewall
- **Firewall** - Network firewall

### Monitoring & Management
- **Monitor** - Monitoring and alerting
- **Log Analytics** - Log management
- **Application Insights** - Application monitoring
- **Azure Policy** - Policy management
- **Blueprints** - Environment templates
- **Resource Manager** - Infrastructure management

### Application Integration
- **Service Bus** - Messaging service
- **Event Grid** - Event routing
- **Event Hubs** - Event streaming
- **Notification Hubs** - Push notifications
- **API Management** - API gateway

### Analytics Services
- **Data Factory** - ETL service
- **Databricks** - Analytics platform
- **HDInsight** - Big data clusters
- **Stream Analytics** - Real-time analytics
- **Synapse Analytics** - Analytics service

### Developer Tools
- **Azure DevOps** - DevOps platform
- **Pipelines** - CI/CD pipelines
- **Repositories** - Source control
- **Artifacts** - Package management
- **Container Registry** - Container registry

---

## How Services Are Detected

1. **From Candidate Introduction**: If candidate mentions specific services (e.g., "I work with S3 and RDS"), those are prioritized
2. **From Job Description**: If JD mentions services, those are included
3. **Provider Detection**: System detects AWS/GCP/Azure and filters services accordingly
4. **Dynamic Prompting**: Questions are generated based on detected services

## Interview Focus by Level

### Entry Level
- Basic service understanding
- Common service failures
- Basic incident response
- Service configuration basics

### Senior Level
- Multi-service failure scenarios
- Service integration issues
- Cost optimization failures
- Security misconfigurations
- Disaster recovery scenarios

### Architect Level
- System design with multiple services
- Well-Architected Framework principles
- Multi-cloud scenarios
- Cost vs reliability trade-offs
- Migration incidents
- Stakeholder management

## Example Scenarios

### AWS Example
If candidate mentions "AWS, S3, RDS, Lambda":
- Questions will focus on S3, RDS, and Lambda incidents
- May include integration scenarios (e.g., Lambda reading from S3, writing to RDS)
- Will test understanding of AWS service interactions

### GCP Example
If candidate mentions "GCP, Cloud Storage, Cloud SQL, Cloud Functions":
- Questions will focus on GCP-specific services
- May include GCP networking (VPC, Cloud Load Balancing)
- Will test understanding of GCP service integration

### Azure Example
If candidate mentions "Azure, Blob Storage, SQL Database, Azure Functions":
- Questions will focus on Azure services
- May include Azure networking (VNet, Application Gateway)
- Will test understanding of Azure service interactions

---

## Notes

- **Dynamic Detection**: Services are detected automatically from candidate/JD input
- **Provider-Specific**: Questions adapt to the cloud provider mentioned
- **Service Integration**: Questions often test how services work together
- **Real-World Scenarios**: Focus on incident-based questions, not definitions
- **Depth Over Breadth**: System drills deep into specific services rather than covering all superficially


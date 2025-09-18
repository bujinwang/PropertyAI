--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN'
);


--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentType" AS ENUM (
    'LEASE',
    'INVOICE',
    'RECEIPT',
    'MAINTENANCE_REPORT',
    'PROPERTY_PHOTO',
    'CONTRACT',
    'OTHER'
);


--
-- Name: LeaseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LeaseStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'EXPIRED',
    'TERMINATED'
);


--
-- Name: ListingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ListingStatus" AS ENUM (
    'ACTIVE',
    'PENDING',
    'DRAFT',
    'ARCHIVED'
);


--
-- Name: MaintenanceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MaintenanceStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'PAID',
    'FAILED',
    'REFUNDED'
);


--
-- Name: Priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'EMERGENCY'
);


--
-- Name: PropertyType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PropertyType" AS ENUM (
    'APARTMENT',
    'HOUSE',
    'CONDO',
    'TOWNHOUSE',
    'COMMERCIAL',
    'INDUSTRIAL',
    'OTHER'
);


--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuestionType" AS ENUM (
    'TEXT',
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'RATING'
);


--
-- Name: QuoteStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuoteStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);


--
-- Name: Sentiment; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Sentiment" AS ENUM (
    'POSITIVE',
    'NEGATIVE',
    'NEUTRAL'
);


--
-- Name: SurveyStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SurveyStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'CLOSED',
    'ARCHIVED'
);


--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED'
);


--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionType" AS ENUM (
    'RENT_PAYMENT',
    'SECURITY_DEPOSIT',
    'MAINTENANCE_FEE',
    'REFUND',
    'OTHER'
);


--
-- Name: UXComponentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UXComponentType" AS ENUM (
    'DASHBOARD',
    'PROPERTY_PAGE',
    'UNIT_PAGE',
    'MAINTENANCE_FLOW',
    'LEASING_FLOW',
    'ONBOARDING',
    'SETTINGS',
    'OTHER'
);


--
-- Name: UXReviewAssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UXReviewAssignmentStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'BLOCKED'
);


--
-- Name: UXReviewPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UXReviewPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: UXReviewStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UXReviewStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'NEEDS_REVISION',
    'APPROVED',
    'REJECTED'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'PROPERTY_MANAGER',
    'TENANT',
    'USER',
    'VENDOR',
    'OWNER'
);


--
-- Name: VendorAvailability; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VendorAvailability" AS ENUM (
    'AVAILABLE',
    'UNAVAILABLE',
    'ON_VACATION'
);


--
-- Name: WorkOrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WorkOrderStatus" AS ENUM (
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AIImageAnalysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AIImageAnalysis" (
    id text NOT NULL,
    "analysisResult" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "imageId" text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AIUsageLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AIUsageLog" (
    id text NOT NULL,
    "userId" text,
    "toolName" text NOT NULL,
    input jsonb,
    output jsonb,
    cost double precision,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ApiKey; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ApiKey" (
    id text NOT NULL,
    key text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    name text
);


--
-- Name: Appliance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Appliance" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentalId" text NOT NULL
);


--
-- Name: Application; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Application" (
    id text NOT NULL,
    "applicantId" text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'PENDING'::public."ApplicationStatus" NOT NULL,
    notes text,
    "appliedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentalId" text NOT NULL
);


--
-- Name: AuditEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditEntry" (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details jsonb,
    "entityId" text NOT NULL,
    "entityType" text NOT NULL
);


--
-- Name: BackgroundCheck; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BackgroundCheck" (
    id text NOT NULL,
    status text NOT NULL,
    "reportUrl" text,
    "applicantId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BusinessHours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BusinessHours" (
    id text NOT NULL,
    "openTime" text NOT NULL,
    "closeTime" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isClosed" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "rentalId" text NOT NULL
);


--
-- Name: Consent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Consent" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "agreedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type text NOT NULL
);


--
-- Name: CostEstimation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CostEstimation" (
    id text NOT NULL,
    "workOrderId" text NOT NULL,
    "estimatedCost" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Device; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Device" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deviceType" text NOT NULL,
    "lastLogin" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    model text,
    os text,
    "pushToken" text
);


--
-- Name: Document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    name text NOT NULL,
    type public."DocumentType" NOT NULL,
    url text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text,
    "leaseId" text,
    "uploadedById" text NOT NULL,
    "maintenanceRequestId" text,
    size integer,
    "mimeType" text,
    "isArchived" boolean DEFAULT false NOT NULL,
    "cdnUrl" text,
    key text,
    "thumbnailCdnUrl" text,
    "thumbnailUrl" text,
    "rentalId" text
);


--
-- Name: EmergencyProtocol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmergencyProtocol" (
    id text NOT NULL,
    description text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    instructions jsonb,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentalId" text NOT NULL
);


--
-- Name: EmergencyRoutingRule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmergencyRoutingRule" (
    id text NOT NULL,
    "vendorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    priority public."Priority" NOT NULL
);


--
-- Name: EscalationPolicy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EscalationPolicy" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentalId" text NOT NULL
);


--
-- Name: EscalationPolicyRule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EscalationPolicyRule" (
    id text NOT NULL,
    "policyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "order" integer NOT NULL,
    action text NOT NULL,
    "assignedToUserId" text,
    threshold text NOT NULL
);


--
-- Name: FollowUp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FollowUp" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    status text NOT NULL,
    "followUpAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: KnowledgeBaseEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."KnowledgeBaseEntry" (
    id text NOT NULL,
    category text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    answer text NOT NULL,
    question text NOT NULL,
    keywords text[]
);


--
-- Name: Language; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Language" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Lease; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lease" (
    id text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "rentAmount" double precision NOT NULL,
    "securityDeposit" double precision NOT NULL,
    "leaseTerms" text,
    status public."LeaseStatus" DEFAULT 'ACTIVE'::public."LeaseStatus" NOT NULL,
    "signedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "renewalDate" timestamp(3) without time zone,
    "tenantId" text NOT NULL,
    "rentalId" text NOT NULL
);


--
-- Name: MaintenanceRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MaintenanceRequest" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status public."MaintenanceStatus" DEFAULT 'OPEN'::public."MaintenanceStatus" NOT NULL,
    priority public."Priority" DEFAULT 'MEDIUM'::public."Priority" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "scheduledDate" timestamp(3) without time zone,
    "completedDate" timestamp(3) without time zone,
    notes text,
    "requestedById" text NOT NULL,
    "estimatedCost" double precision,
    "actualCost" double precision,
    "categoryId" text,
    "rentalId" text NOT NULL
);


--
-- Name: MaintenanceRequestCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MaintenanceRequestCategory" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MaintenanceResponseTime; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MaintenanceResponseTime" (
    id text NOT NULL,
    "maintenanceRequestId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "responseTime" integer NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MarketData; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MarketData" (
    id text NOT NULL,
    "averageRent" double precision NOT NULL,
    location text NOT NULL,
    "vacancyRate" double precision NOT NULL,
    bedrooms integer,
    "dataDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "propertyType" public."PropertyType"
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    content text NOT NULL,
    "senderId" text NOT NULL,
    "maintenanceRequestId" text,
    "conversationId" text,
    "readAt" timestamp(3) without time zone,
    "receiverId" text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category text,
    "isEarlyWarning" boolean DEFAULT false NOT NULL,
    sentiment public."Sentiment" DEFAULT 'NEUTRAL'::public."Sentiment",
    "sentimentScore" double precision
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL,
    link text,
    type text NOT NULL
);


--
-- Name: OAuthAccessToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OAuthAccessToken" (
    id text NOT NULL,
    "accessToken" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL
);


--
-- Name: OAuthConnection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OAuthConnection" (
    id text NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text,
    "userId" text NOT NULL,
    "providerId" text NOT NULL,
    provider text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OnCallRotation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OnCallRotation" (
    id text NOT NULL,
    "scheduleId" text NOT NULL,
    "userId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OnCallSchedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OnCallSchedule" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentalId" text NOT NULL
);


--
-- Name: PasswordResetToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PasswordResetToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Permission" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    description text
);


--
-- Name: PhotoAnalysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PhotoAnalysis" (
    id text NOT NULL,
    "maintenanceRequestId" text NOT NULL,
    "analysisResult" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PredictiveMaintenance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PredictiveMaintenance" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    prediction jsonb,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rentalId" text NOT NULL
);


--
-- Name: Rental; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Rental" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "zipCode" text NOT NULL,
    country text DEFAULT 'USA'::text NOT NULL,
    latitude double precision,
    longitude double precision,
    "propertyType" public."PropertyType" NOT NULL,
    "yearBuilt" integer,
    "totalUnits" integer DEFAULT 1 NOT NULL,
    amenities jsonb,
    "unitNumber" text,
    "floorNumber" integer,
    size double precision,
    bedrooms integer,
    bathrooms double precision,
    rent double precision NOT NULL,
    deposit double precision,
    "availableDate" timestamp(3) without time zone,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "leaseTerms" text,
    slug text NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    status public."ListingStatus" DEFAULT 'ACTIVE'::public."ListingStatus" NOT NULL,
    "managerId" text NOT NULL,
    "ownerId" text NOT NULL,
    "createdById" text NOT NULL,
    "whiteLabelConfigId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RentalImage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RentalImage" (
    id integer NOT NULL,
    "rentalId" text NOT NULL,
    filename text NOT NULL,
    "originalFilename" text NOT NULL,
    mimetype text NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    "cdnUrl" text,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RentalImage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."RentalImage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RentalImage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."RentalImage_id_seq" OWNED BY public."RentalImage".id;


--
-- Name: RiskAssessment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RiskAssessment" (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    score double precision NOT NULL,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ScheduledEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ScheduledEvent" (
    id text NOT NULL,
    "workOrderId" text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    description text,
    title text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    location text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Screening; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Screening" (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reportUrl" text,
    status text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TenantIssuePrediction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TenantIssuePrediction" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "predictedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "issueType" text NOT NULL,
    likelihood double precision NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TenantRating; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TenantRating" (
    id text NOT NULL,
    "leaseId" text NOT NULL,
    "tenantId" text NOT NULL,
    "raterId" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    attachments text[],
    categories jsonb,
    "overallRating" numeric(65,30),
    tags text[]
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    amount double precision NOT NULL,
    type public."TransactionType" NOT NULL,
    status public."TransactionStatus" DEFAULT 'PENDING'::public."TransactionStatus" NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "leaseId" text NOT NULL,
    "approvedById" text,
    "transactionDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UXReview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UXReview" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status public."UXReviewStatus" DEFAULT 'PENDING'::public."UXReviewStatus" NOT NULL,
    priority public."UXReviewPriority" DEFAULT 'MEDIUM'::public."UXReviewPriority" NOT NULL,
    "componentType" public."UXComponentType" NOT NULL,
    "reviewerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UXReviewAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UXReviewAssignment" (
    id text NOT NULL,
    "reviewId" text NOT NULL,
    "assigneeId" text NOT NULL,
    status public."UXReviewAssignmentStatus" DEFAULT 'PENDING'::public."UXReviewAssignmentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UXReviewComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UXReviewComment" (
    id text NOT NULL,
    "reviewId" text NOT NULL,
    content text NOT NULL,
    "authorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UXSurvey; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UXSurvey" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status public."SurveyStatus" DEFAULT 'DRAFT'::public."SurveyStatus" NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UXSurveyAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UXSurveyAnswer" (
    id text NOT NULL,
    "responseId" text NOT NULL,
    "questionId" text NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UXSurveyQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UXSurveyQuestion" (
    id text NOT NULL,
    "surveyId" text NOT NULL,
    question text NOT NULL,
    type public."QuestionType" NOT NULL,
    options jsonb,
    "order" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UXSurveyResponse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UXSurveyResponse" (
    id text NOT NULL,
    "surveyId" text NOT NULL,
    "respondentId" text NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    role public."UserRole" DEFAULT 'TENANT'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "mfaEnabled" boolean DEFAULT false NOT NULL,
    "mfaSecret" text,
    "passwordResetExpires" timestamp(3) without time zone,
    "passwordResetToken" text,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "isLocked" boolean DEFAULT false NOT NULL,
    "lockedUntil" timestamp(3) without time zone,
    "lastLockedAt" timestamp(3) without time zone,
    settings jsonb,
    "lastLogin" timestamp(3) without time zone,
    "refreshToken" text,
    "stripeCustomerId" text,
    "pushToken" text
);


--
-- Name: Vendor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Vendor" (
    id text NOT NULL,
    name text NOT NULL,
    "contactPersonId" text,
    phone text NOT NULL,
    email text NOT NULL,
    address text NOT NULL,
    specialty text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    certifications text[],
    "hourlyRate" double precision,
    "serviceAreas" text[],
    workload integer DEFAULT 0 NOT NULL,
    latitude double precision,
    longitude double precision,
    "standardRate" double precision,
    availability text NOT NULL,
    "stripeAccountId" text
);


--
-- Name: VendorPayment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VendorPayment" (
    id text NOT NULL,
    amount double precision NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "workOrderId" text NOT NULL,
    "vendorId" text NOT NULL,
    "transactionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approvedById" text,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: VendorPerformanceRating; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VendorPerformanceRating" (
    id text NOT NULL,
    "vendorId" text NOT NULL,
    "workOrderId" text NOT NULL,
    "ratedById" text NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rating integer NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: WhiteLabelConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WhiteLabelConfig" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    platform text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "appName" text,
    "logoUrl" text,
    "primaryColor" text,
    "secondaryColor" text
);


--
-- Name: WorkOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WorkOrder" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    status public."WorkOrderStatus" DEFAULT 'OPEN'::public."WorkOrderStatus" NOT NULL,
    priority public."Priority" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "maintenanceRequestId" text NOT NULL
);


--
-- Name: WorkOrderAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WorkOrderAssignment" (
    id text NOT NULL,
    "workOrderId" text NOT NULL,
    "vendorId" text NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text
);


--
-- Name: WorkOrderQuote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WorkOrderQuote" (
    id text NOT NULL,
    "workOrderId" text NOT NULL,
    "vendorId" text NOT NULL,
    amount double precision NOT NULL,
    details text,
    status public."QuoteStatus" DEFAULT 'PENDING'::public."QuoteStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _PermissionToRole; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_PermissionToRole" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _RentalWhiteLabelConfigs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_RentalWhiteLabelConfigs" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _RoleToUser; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_RoleToUser" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: RentalImage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RentalImage" ALTER COLUMN id SET DEFAULT nextval('public."RentalImage_id_seq"'::regclass);


--
-- Data for Name: AIImageAnalysis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIImageAnalysis" (id, "analysisResult", "createdAt", "imageId", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AIUsageLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AIUsageLog" (id, "userId", "toolName", input, output, cost, "timestamp") FROM stdin;
\.


--
-- Data for Name: ApiKey; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ApiKey" (id, key, "userId", "expiresAt", "createdAt", "isActive", name) FROM stdin;
\.


--
-- Data for Name: Appliance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Appliance" (id, name, "createdAt", type, "updatedAt", "rentalId") FROM stdin;
\.


--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Application" (id, "applicantId", status, notes, "appliedDate", "createdAt", "updatedAt", "rentalId") FROM stdin;
\.


--
-- Data for Name: AuditEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditEntry" (id, "userId", action, "timestamp", details, "entityId", "entityType") FROM stdin;
\.


--
-- Data for Name: BackgroundCheck; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BackgroundCheck" (id, status, "reportUrl", "applicantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BusinessHours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BusinessHours" (id, "openTime", "closeTime", "createdAt", "isClosed", "updatedAt", "dayOfWeek", "rentalId") FROM stdin;
\.


--
-- Data for Name: Consent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Consent" (id, "userId", "createdAt", "updatedAt", "agreedAt", type) FROM stdin;
\.


--
-- Data for Name: CostEstimation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CostEstimation" (id, "workOrderId", "estimatedCost", "createdAt", details, "updatedAt") FROM stdin;
\.


--
-- Data for Name: Device; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Device" (id, "userId", "createdAt", "updatedAt", "deviceType", "lastLogin", model, os, "pushToken") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Document" (id, name, type, url, "uploadedAt", "updatedAt", description, "leaseId", "uploadedById", "maintenanceRequestId", size, "mimeType", "isArchived", "cdnUrl", key, "thumbnailCdnUrl", "thumbnailUrl", "rentalId") FROM stdin;
\.


--
-- Data for Name: EmergencyProtocol; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmergencyProtocol" (id, description, name, "createdAt", instructions, "updatedAt", "rentalId") FROM stdin;
\.


--
-- Data for Name: EmergencyRoutingRule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmergencyRoutingRule" (id, "vendorId", "createdAt", "updatedAt", priority) FROM stdin;
\.


--
-- Data for Name: EscalationPolicy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EscalationPolicy" (id, name, description, "createdAt", "updatedAt", "rentalId") FROM stdin;
\.


--
-- Data for Name: EscalationPolicyRule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EscalationPolicyRule" (id, "policyId", "createdAt", "updatedAt", "order", action, "assignedToUserId", threshold) FROM stdin;
\.


--
-- Data for Name: FollowUp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FollowUp" (id, "messageId", status, "followUpAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: KnowledgeBaseEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."KnowledgeBaseEntry" (id, category, "createdAt", "updatedAt", answer, question, keywords) FROM stdin;
\.


--
-- Data for Name: Language; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Language" (id, code, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Lease; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Lease" (id, "startDate", "endDate", "rentAmount", "securityDeposit", "leaseTerms", status, "signedDate", "createdAt", "updatedAt", "renewalDate", "tenantId", "rentalId") FROM stdin;
cme32gtqb001k3zbyeqkyunir	2024-01-01 00:00:00	2024-12-31 00:00:00	2500	2500	Standard 1-year lease agreement for Unit 101 at Sunrise Apartments.\n    Rent is due on the 1st of each month.\n    Utilities (water, trash) included; tenant responsible for electricity, internet, and cable.\n    No pets allowed without prior written approval and pet deposit.\n    Renewal terms to be negotiated 60 days before lease expiration.	ACTIVE	2023-12-15 00:00:00	2025-08-08 16:55:05.604	2025-08-08 16:55:05.604	2024-10-31 00:00:00	cme32gtgf000i3zbyxyy46amh	cme32gtpt000w3zbynzdsl2qp
cme32gtqd001m3zbyl86vk5s3	2024-03-01 00:00:00	2025-02-28 00:00:00	2700	2700	Standard 1-year lease agreement for Unit 102 at Sunrise Apartments.\n    Rent is due on the 1st of each month.\n    Utilities (water, trash) included; tenant responsible for electricity, internet, and cable.\n    Pet deposit of $500 has been paid for one cat.\n    Renewal terms to be negotiated 60 days before lease expiration.	ACTIVE	2024-02-15 00:00:00	2025-08-08 16:55:05.605	2025-08-08 16:55:05.605	2024-12-31 00:00:00	cme32gthy000j3zby2930igrz	cme32gtpy000y3zbyfutdip7y
cme32gtqe001o3zbyz9zr07os	2023-08-01 00:00:00	2024-07-31 00:00:00	3800	3800	Standard 1-year lease agreement for Unit A1 at Parkview Townhomes.\n    Rent is due on the 1st of each month.\n    Utilities (water, trash) included; tenant responsible for electricity, gas, internet, and cable.\n    Pet deposit of $750 has been paid for one dog.\n    Tenant responsible for lawn maintenance of private patio area.\n    Renewal terms to be negotiated 60 days before lease expiration.	ACTIVE	2023-07-15 00:00:00	2025-08-08 16:55:05.606	2025-08-08 16:55:05.606	2024-05-31 00:00:00	cme32gtjj000k3zbyg1cy3j0z	cme32gtq200143zbylqqfrwby
cme32gtqf001q3zby4tlbba8p	2023-06-01 00:00:00	2025-05-31 00:00:00	5500	5500	2-year lease agreement for Oakridge House.\n    Rent is due on the 1st of each month.\n    Tenant responsible for all utilities including water, electricity, gas, internet, cable, and trash.\n    Tenant responsible for regular lawn maintenance and garden upkeep.\n    Pet deposit of $1000 has been paid for two dogs.\n    Renewal terms to be negotiated 90 days before lease expiration.	ACTIVE	2023-05-15 00:00:00	2025-08-08 16:55:05.608	2025-08-08 16:55:05.608	2025-02-28 00:00:00	cme32gtl2000l3zbyvmek7zrw	cme32gtq400183zbyjlcd93by
cme32gtqg001s3zby67ryi2bs	2024-02-01 00:00:00	2025-01-31 00:00:00	3000	3000	Standard 1-year lease agreement for Unit 1A at Bayview Condos.\n    Rent is due on the 1st of each month.\n    Utilities (water, trash) included; tenant responsible for electricity, internet, and cable.\n    No pets allowed as per condo association rules.\n    Tenant must comply with all condo association regulations.\n    Renewal terms to be negotiated 60 days before lease expiration.	ACTIVE	2024-01-15 00:00:00	2025-08-08 16:55:05.609	2025-08-08 16:55:05.609	2024-12-01 00:00:00	cme32gtml000m3zbybeybwvjm	cme32gtq6001a3zbyj6pby9q4
cme32gtqh001u3zbyizyw0rfq	2023-10-01 00:00:00	2024-09-30 00:00:00	3900	3900	Standard 1-year lease agreement for Unit 2B at Bayview Condos.\n    Rent is due on the 1st of each month.\n    Utilities (water, trash) included; tenant responsible for electricity, internet, and cable.\n    No pets allowed as per condo association rules.\n    Tenant must comply with all condo association regulations.\n    Renewal terms to be negotiated 60 days before lease expiration.	ACTIVE	2023-09-15 00:00:00	2025-08-08 16:55:05.61	2025-08-08 16:55:05.61	2024-07-31 00:00:00	cme32gto4000n3zbynummp2dr	cme32gtq8001c3zbyfn922d1e
\.


--
-- Data for Name: MaintenanceRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaintenanceRequest" (id, title, description, status, priority, "createdAt", "updatedAt", "scheduledDate", "completedDate", notes, "requestedById", "estimatedCost", "actualCost", "categoryId", "rentalId") FROM stdin;
cme32gtqj001w3zbyytxl4n3q	Leaking Bathroom Sink	The bathroom sink has a slow leak underneath the cabinet. There is a small puddle forming after each use.	OPEN	MEDIUM	2025-08-05 16:55:04.7	2025-08-08 16:55:05.611	\N	\N	Scheduled for inspection next week.	cme32gtgf000i3zbyxyy46amh	150	\N	\N	cme32gtpt000w3zbynzdsl2qp
cme32gtql001y3zbyv6qg1oho	Broken Air Conditioning	The air conditioning unit is not cooling properly. Current temperature is 82°F even with AC set to 72°F.	IN_PROGRESS	HIGH	2025-08-06 16:55:04.7	2025-08-08 16:55:05.613	2025-08-09 16:55:04.7	\N	HVAC technician will come tomorrow. Initial inspection suggests compressor issue.	cme32gtjj000k3zbyg1cy3j0z	600	\N	\N	cme32gtq200143zbylqqfrwby
cme32gtqn00203zbyuiqftiq0	Replace Smoke Detector Batteries	The smoke detector in the hallway is chirping, likely due to low batteries.	OPEN	LOW	2025-08-07 16:55:04.7	2025-08-08 16:55:05.615	\N	\N	Will include in routine maintenance visit next week.	cme32gthy000j3zby2930igrz	15	\N	\N	cme32gtpy000y3zbyfutdip7y
cme32gtqo00223zbysbet1hpf	Roof Leak During Heavy Rain	During the last rainstorm, there was water dripping from the ceiling in the master bedroom, near the exterior wall.	IN_PROGRESS	HIGH	2025-08-03 16:55:04.7	2025-08-08 16:55:05.616	2025-08-08 16:55:04.7	\N	Roofer inspected yesterday, identified damaged shingles. Repair scheduled for today.	cme32gtl2000l3zbyvmek7zrw	850	\N	\N	cme32gtq400183zbyjlcd93by
cme32gtqp00243zby6d76gi97	Replace Kitchen Faucet	The kitchen faucet is leaking and the spray function does not work. Would like to have it replaced if possible.	COMPLETED	MEDIUM	2025-07-25 16:55:04.7	2025-08-08 16:55:05.618	2025-07-29 16:55:04.7	2025-07-29 16:55:04.7	Replaced with new Delta touchless faucet. Tested and working well. Tenant very satisfied with upgrade.	cme32gtml000m3zbybeybwvjm	220	245.75	\N	cme32gtq6001a3zbyj6pby9q4
cme32gtqt00263zby7l4gkbm8	Gas Smell in Kitchen	There is a distinct smell of gas coming from around the stove area. Very concerned as the smell is strong.	IN_PROGRESS	EMERGENCY	2025-08-08 10:55:04.7	2025-08-08 16:55:05.621	2025-08-08 12:55:04.7	\N	Emergency response team dispatched immediately. Gas company also notified. Preliminary inspection identified loose connection in gas stove. Temporarily shut off gas to unit, repair in progress.	cme32gtgf000i3zbyxyy46amh	300	\N	\N	cme32gtpt000w3zbynzdsl2qp
\.


--
-- Data for Name: MaintenanceRequestCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaintenanceRequestCategory" (id, name, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MaintenanceResponseTime; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaintenanceResponseTime" (id, "maintenanceRequestId", "createdAt", "responseTime", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MarketData; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MarketData" (id, "averageRent", location, "vacancyRate", bedrooms, "dataDate", "propertyType") FROM stdin;
cme32gtqu00273zbymcix75ks	3500	San Francisco, CA	0.05	1	2025-01-01 00:00:00	APARTMENT
cme32gtqv00283zby665p38f6	4200	San Francisco, CA	0.04	2	2025-01-01 00:00:00	APARTMENT
cme32gtqw00293zbympyh80t2	3200	New York, NY	0.06	1	2025-01-01 00:00:00	APARTMENT
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Message" (id, content, "senderId", "maintenanceRequestId", "conversationId", "readAt", "receiverId", "sentAt", category, "isEarlyWarning", sentiment, "sentimentScore") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, message, "isRead", "createdAt", "userId", link, type) FROM stdin;
\.


--
-- Data for Name: OAuthAccessToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OAuthAccessToken" (id, "accessToken", "expiresAt", "createdAt", "userId") FROM stdin;
\.


--
-- Data for Name: OAuthConnection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OAuthConnection" (id, "accessToken", "refreshToken", "userId", "providerId", provider, "createdAt", "expiresAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OnCallRotation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OnCallRotation" (id, "scheduleId", "userId", "startDate", "endDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OnCallSchedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OnCallSchedule" (id, name, description, "createdAt", "updatedAt", "rentalId") FROM stdin;
\.


--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PasswordResetToken" (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Permission" (id, name, "createdAt", "updatedAt", description) FROM stdin;
cme32gt4m00003zbym5oa3x7p	create:user	2025-08-08 16:55:04.823	2025-08-08 16:55:04.823	\N
cme32gt4n00013zbyh5d11mqj	read:user	2025-08-08 16:55:04.823	2025-08-08 16:55:04.823	\N
cme32gt4n00023zbyc3xlp61e	update:user	2025-08-08 16:55:04.823	2025-08-08 16:55:04.823	\N
cme32gt4n00033zbyjjk8yjui	delete:user	2025-08-08 16:55:04.823	2025-08-08 16:55:04.823	\N
cme32gt4n00043zbyt6ns8jlv	create:property	2025-08-08 16:55:04.823	2025-08-08 16:55:04.823	\N
cme32gt4n00053zbygxoakt3e	read:property	2025-08-08 16:55:04.823	2025-08-08 16:55:04.823	\N
cme32gt4n00063zbyt86r6dz0	update:property	2025-08-08 16:55:04.823	2025-08-08 16:55:04.823	\N
cme32gt4n00073zbybqksbcss	delete:property	2025-08-08 16:55:04.823	2025-08-08 16:55:04.823	\N
\.


--
-- Data for Name: PhotoAnalysis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PhotoAnalysis" (id, "maintenanceRequestId", "analysisResult", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PredictiveMaintenance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PredictiveMaintenance" (id, "createdAt", prediction, "updatedAt", "rentalId") FROM stdin;
\.


--
-- Data for Name: Rental; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Rental" (id, title, description, address, city, state, "zipCode", country, latitude, longitude, "propertyType", "yearBuilt", "totalUnits", amenities, "unitNumber", "floorNumber", size, bedrooms, bathrooms, rent, deposit, "availableDate", "isAvailable", "leaseTerms", slug, "viewCount", "isActive", status, "managerId", "ownerId", "createdById", "whiteLabelConfigId", "createdAt", "updatedAt") FROM stdin;
cme32gtpt000w3zbynzdsl2qp	Sunrise Apartments - Unit 101	Modern apartment complex in the heart of San Francisco with stunning bay views and premium amenities.	1234 Main Street	San Francisco	CA	94105	USA	37.7749	-122.4194	APARTMENT	2010	24	{"hasAC": true, "hasGym": true, "hasPool": true, "furnished": false, "hasBalcony": true, "hasElevator": true, "isPetFriendly": true, "hasRooftopDeck": true, "hasWasherDryer": true, "hasWalkInCloset": false, "hasParkingGarage": true, "securityFeatures": ["24/7 Security", "Key Card Access", "Security Cameras"], "communityFeatures": ["Community Room", "Business Center", "Courtyard"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	101	1	750	1	1	2500	2500	\N	f	\N	sunrise-apartments-unit-101-1	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.586	2025-08-08 16:55:05.586
cme32gtpy000y3zbyfutdip7y	Sunrise Apartments - Unit 102	Modern apartment complex in the heart of San Francisco with stunning bay views and premium amenities.	1234 Main Street	San Francisco	CA	94105	USA	37.7749	-122.4194	APARTMENT	2010	24	{"hasAC": true, "hasGym": true, "hasPool": true, "furnished": false, "hasBalcony": true, "hasElevator": true, "isPetFriendly": true, "hasRooftopDeck": true, "hasWasherDryer": true, "hasWalkInCloset": true, "hasParkingGarage": true, "securityFeatures": ["24/7 Security", "Key Card Access", "Security Cameras"], "communityFeatures": ["Community Room", "Business Center", "Courtyard"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	102	1	850	1	1	2700	2700	\N	f	\N	sunrise-apartments-unit-102-2	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.59	2025-08-08 16:55:05.59
cme32gtpz00103zby3z7ywv7j	Sunrise Apartments - Unit 201	Modern apartment complex in the heart of San Francisco with stunning bay views and premium amenities.	1234 Main Street	San Francisco	CA	94105	USA	37.7749	-122.4194	APARTMENT	2010	24	{"hasAC": true, "hasGym": true, "hasPool": true, "furnished": false, "hasBalcony": true, "hasElevator": true, "hasFireplace": true, "isPetFriendly": true, "hasRooftopDeck": true, "hasWasherDryer": true, "hasWalkInCloset": true, "hasParkingGarage": true, "securityFeatures": ["24/7 Security", "Key Card Access", "Security Cameras"], "communityFeatures": ["Community Room", "Business Center", "Courtyard"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	201	2	1050	2	2	3500	3500	2025-09-07 16:55:04.693	t	\N	sunrise-apartments-unit-201-3	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.592	2025-08-08 16:55:05.592
cme32gtq100123zbya3ae8l3h	Sunrise Apartments - Unit 301	Modern apartment complex in the heart of San Francisco with stunning bay views and premium amenities.	1234 Main Street	San Francisco	CA	94105	USA	37.7749	-122.4194	APARTMENT	2010	24	{"hasAC": true, "hasGym": true, "hasPool": true, "furnished": false, "hasBalcony": true, "hasElevator": true, "hasFireplace": true, "isPetFriendly": true, "hasCeilingFans": true, "hasRooftopDeck": true, "hasWasherDryer": true, "hasWalkInCloset": true, "hasParkingGarage": true, "securityFeatures": ["24/7 Security", "Key Card Access", "Security Cameras"], "communityFeatures": ["Community Room", "Business Center", "Courtyard"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	301	3	1200	2	2.5	4000	4000	\N	t	\N	sunrise-apartments-unit-301-4	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.593	2025-08-08 16:55:05.593
cme32gtq200143zbylqqfrwby	Parkview Townhomes - Unit A1	Spacious townhomes adjacent to Central Park with modern finishes and private patios.	5678 Park Avenue	San Jose	CA	95110	USA	37.3382	-121.8863	TOWNHOUSE	2015	12	{"hasAC": true, "hasGym": false, "hasPool": true, "furnished": false, "hasGarage": true, "hasElevator": false, "hasFireplace": true, "isPetFriendly": true, "hasPatioGarden": true, "hasWasherDryer": true, "hasWalkInCloset": true, "hasParkingGarage": true, "securityFeatures": ["Gated Community", "Security Cameras"], "communityFeatures": ["Playground", "Walking Trails", "Dog Park"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	A1	1	1500	2	2.5	3800	3800	\N	f	\N	parkview-townhomes-unit-A1-5	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.594	2025-08-08 16:55:05.594
cme32gtq300163zby7fv5fpdi	Parkview Townhomes - Unit B2	Spacious townhomes adjacent to Central Park with modern finishes and private patios.	5678 Park Avenue	San Jose	CA	95110	USA	37.3382	-121.8863	TOWNHOUSE	2015	12	{"hasAC": true, "hasGym": false, "hasPool": true, "furnished": false, "hasGarage": true, "hasBasement": true, "hasElevator": false, "hasFireplace": true, "isPetFriendly": true, "hasPatioGarden": true, "hasWasherDryer": true, "hasWalkInCloset": true, "hasParkingGarage": true, "securityFeatures": ["Gated Community", "Security Cameras"], "communityFeatures": ["Playground", "Walking Trails", "Dog Park"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	B2	1	1650	3	2.5	4200	4200	2025-08-23 16:55:04.693	t	\N	parkview-townhomes-unit-B2-6	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.595	2025-08-08 16:55:05.595
cme32gtq400183zbyjlcd93by	Oakridge House - Unit Main House	Charming single-family home in a quiet neighborhood with a large backyard and renovated interior.	910 Oak Lane	Palo Alto	CA	94301	USA	37.4419	-122.143	HOUSE	1985	1	{"hasAC": true, "hasDeck": true, "hasPool": false, "furnished": false, "hasGarage": true, "hasBackyard": true, "hasBasement": true, "hasFireplace": true, "isPetFriendly": true, "hasWasherDryer": true, "hasWalkInCloset": true, "specialFeatures": ["Recently Renovated Kitchen", "Hardwood Floors", "Solar Panels"], "securityFeatures": ["Alarm System"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	Main House	\N	2200	4	3	5500	5500	\N	f	\N	oakridge-house-unit-Main House-7	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.597	2025-08-08 16:55:05.597
cme32gtq6001a3zbyj6pby9q4	Bayview Condos - Unit 1A	Luxury condominiums with waterfront views, high-end finishes, and resort-style amenities.	123 Waterfront Drive	Oakland	CA	94607	USA	37.8044	-122.2711	CONDO	2018	36	{"hasAC": true, "hasGym": true, "hasSpa": true, "hasPool": true, "furnished": false, "hasBalcony": true, "hasElevator": true, "hasFireplace": false, "isPetFriendly": false, "hasRooftopDeck": true, "hasWasherDryer": true, "hasWalkInCloset": true, "hasParkingGarage": true, "securityFeatures": ["24/7 Concierge", "Key Card Access", "Security Cameras"], "communityFeatures": ["Wine Cellar", "Conference Room", "Party Room", "Guest Suites"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	1A	1	950	1	1.5	3000	3000	\N	f	\N	bayview-condos-unit-1A-8	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.599	2025-08-08 16:55:05.599
cme32gtq8001c3zbyfn922d1e	Bayview Condos - Unit 2B	Luxury condominiums with waterfront views, high-end finishes, and resort-style amenities.	123 Waterfront Drive	Oakland	CA	94607	USA	37.8044	-122.2711	CONDO	2018	36	{"hasAC": true, "hasGym": true, "hasSpa": true, "hasPool": true, "furnished": false, "hasBalcony": true, "hasElevator": true, "hasFireplace": true, "isPetFriendly": false, "hasRooftopDeck": true, "hasWasherDryer": true, "hasWalkInCloset": true, "hasParkingGarage": true, "securityFeatures": ["24/7 Concierge", "Key Card Access", "Security Cameras"], "communityFeatures": ["Wine Cellar", "Conference Room", "Party Room", "Guest Suites"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	2B	2	1150	2	2	3900	3900	\N	f	\N	bayview-condos-unit-2B-9	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.6	2025-08-08 16:55:05.6
cme32gtq9001e3zbyzm7ji5yb	Bayview Condos - Unit 3C	Luxury condominiums with waterfront views, high-end finishes, and resort-style amenities.	123 Waterfront Drive	Oakland	CA	94607	USA	37.8044	-122.2711	CONDO	2018	36	{"hasAC": true, "hasGym": true, "hasSpa": true, "hasPool": true, "furnished": false, "hasBalcony": true, "hasElevator": true, "hasFireplace": true, "isPetFriendly": false, "hasCeilingFans": true, "hasRooftopDeck": true, "hasWasherDryer": true, "hasWalkInCloset": true, "hasParkingGarage": true, "securityFeatures": ["24/7 Concierge", "Key Card Access", "Security Cameras"], "communityFeatures": ["Wine Cellar", "Conference Room", "Party Room", "Guest Suites"], "hasHardwoodFloors": true, "hasStainlessSteelAppliances": true}	3C	3	1400	3	2.5	4800	4800	\N	t	\N	bayview-condos-unit-3C-10	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.601	2025-08-08 16:55:05.601
cme32gtq9001g3zby474ue1ni	Tech Plaza - Unit Suite 101	Modern office complex designed for tech companies with flexible workspaces and cutting-edge amenities.	456 Innovation Way	Mountain View	CA	94043	USA	37.3861	-122.0839	COMMERCIAL	2019	15	{"hasWindow": true, "hasParking": true, "hasShowers": true, "hasCafeteria": true, "hasReception": false, "hasBikeStorage": true, "hasKitchenette": true, "officeFeatures": ["Open Floor Plans", "Private Offices", "Phone Booths", "Break Rooms"], "securityFeatures": ["24/7 Security", "Key Card Access", "Security Cameras"], "hasConferenceRoom": false, "hasConferenceRooms": true, "hasPrivateRestroom": false, "hasHighSpeedInternet": true}	Suite 101	1	800	\N	\N	3000	6000	\N	t	\N	tech-plaza-unit-Suite 101-11	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.602	2025-08-08 16:55:05.602
cme32gtqb001i3zbydx8fiqbg	Tech Plaza - Unit Suite 201	Modern office complex designed for tech companies with flexible workspaces and cutting-edge amenities.	456 Innovation Way	Mountain View	CA	94043	USA	37.3861	-122.0839	COMMERCIAL	2019	15	{"hasWindow": true, "hasParking": true, "hasShowers": true, "hasCafeteria": true, "hasReception": true, "hasBikeStorage": true, "hasKitchenette": true, "officeFeatures": ["Open Floor Plans", "Private Offices", "Phone Booths", "Break Rooms"], "securityFeatures": ["24/7 Security", "Key Card Access", "Security Cameras"], "hasConferenceRoom": true, "hasConferenceRooms": true, "hasPrivateRestroom": true, "hasHighSpeedInternet": true}	Suite 201	2	1500	\N	\N	5500	11000	\N	t	\N	tech-plaza-unit-Suite 201-12	0	t	ACTIVE	cme32gt8n000d3zbyzl92o49b	cme32gt6q000c3zbymux3h5ki	cme32gt6q000c3zbymux3h5ki	\N	2025-08-08 16:55:05.603	2025-08-08 16:55:05.603
\.


--
-- Data for Name: RentalImage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RentalImage" (id, "rentalId", filename, "originalFilename", mimetype, size, url, "cdnUrl", "isFeatured", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RiskAssessment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RiskAssessment" (id, "applicationId", score, details, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Role" (id, name, "createdAt", "updatedAt") FROM stdin;
cme32gt4q00083zbytyzppujn	ADMIN	2025-08-08 16:55:04.826	2025-08-08 16:55:04.826
cme32gt4v00093zby1bk2ehpi	PROPERTY_MANAGER	2025-08-08 16:55:04.831	2025-08-08 16:55:04.831
cme32gt4w000a3zbyzzqm4vgg	TENANT	2025-08-08 16:55:04.833	2025-08-08 16:55:04.833
cme32gt4y000b3zbyu59d4erp	VENDOR	2025-08-08 16:55:04.834	2025-08-08 16:55:04.834
\.


--
-- Data for Name: ScheduledEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduledEvent" (id, "workOrderId", "startTime", "endTime", description, title, "createdAt", location, "updatedAt") FROM stdin;
\.


--
-- Data for Name: Screening; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Screening" (id, "applicationId", "createdAt", "reportUrl", status, "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenantIssuePrediction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TenantIssuePrediction" (id, "tenantId", "predictedAt", "createdAt", "issueType", likelihood, "resolvedAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TenantRating; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TenantRating" (id, "leaseId", "tenantId", "raterId", rating, comment, "createdAt", "updatedAt", attachments, categories, "overallRating", tags) FROM stdin;
cme4rzjuh0001y3h01kze1kln	cme32gtqb001k3zbyeqkyunir	cme32gtgf000i3zbyxyy46amh	cme32gt6q000c3zbymux3h5ki	5	\N	2025-08-09 21:37:15.833	2025-08-09 21:37:15.833	{}	{"cleanliness": 5, "propertyCare": 5, "communication": 4, "paymentHistory": 5}	4.800000000000000000000000000000	{}
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, amount, type, status, description, "createdAt", "leaseId", "approvedById", "transactionDate", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UXReview; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UXReview" (id, title, description, status, priority, "componentType", "reviewerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UXReviewAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UXReviewAssignment" (id, "reviewId", "assigneeId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UXReviewComment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UXReviewComment" (id, "reviewId", content, "authorId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UXSurvey; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UXSurvey" (id, title, description, status, "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UXSurveyAnswer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UXSurveyAnswer" (id, "responseId", "questionId", value, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UXSurveyQuestion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UXSurveyQuestion" (id, "surveyId", question, type, options, "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UXSurveyResponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UXSurveyResponse" (id, "surveyId", "respondentId", "submittedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, password, "firstName", "lastName", phone, role, "createdAt", "updatedAt", "isActive", "mfaEnabled", "mfaSecret", "passwordResetExpires", "passwordResetToken", "failedLoginAttempts", "isLocked", "lockedUntil", "lastLockedAt", settings, "lastLogin", "refreshToken", "stripeCustomerId", "pushToken") FROM stdin;
cme32gtl2000l3zbyvmek7zrw	lisa.tenant@example.com	$2b$10$yDLicd0oVBin2m0tTcAiceeNF9tiV6Ml4go2pvJjflDGcVA7rlIH6	Lisa	Brown	555-789-0123	TENANT	2025-08-08 16:55:05.414	2025-08-08 16:55:05.414	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gtml000m3zbybeybwvjm	james.tenant@example.com	$2b$10$D7GP8.keyFlSLviKOBaOfuxbo9XEQydNA4d7BGEnL856YQT72SjGG	James	Miller	555-890-1234	TENANT	2025-08-08 16:55:05.469	2025-08-08 16:55:05.469	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gto4000n3zbynummp2dr	olivia.tenant@example.com	$2b$10$.7cmPkpemV0ECBE1yhHzkOW0R7UYrZBjkXbfnpdn7yHCcIMGVdy/O	Olivia	Martinez	555-901-2345	TENANT	2025-08-08 16:55:05.525	2025-08-08 16:55:05.525	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gtpo000o3zbybi50ukyg	inactive.tenant@example.com	$2b$10$mMZ2blWugSpfvrxNo45Is.1CiuZH0q0yoFXktsuldya/8x92CN.OW	Inactive	User	555-012-3456	TENANT	2025-08-08 16:55:05.581	2025-08-08 16:55:05.581	f	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gt8n000d3zbyzl92o49b	sarah.manager@propertyai.com	$2b$10$0X2tcKIA.06POygr.LvJmOVssrPVCn/lfmNeeakH98D.Y6I38TLTe	Sarah	Johnson	555-234-5678	PROPERTY_MANAGER	2025-08-08 16:55:04.968	2025-08-08 16:55:04.968	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gta7000e3zbyyysaznaf	michael.manager@propertyai.com	$2b$10$rpA6o2glUw/0NmjxJBGnf.JR40QDhXO7pTQ5szBvgROTNmmBzxMTy	Michael	Thompson	555-345-6789	PROPERTY_MANAGER	2025-08-08 16:55:05.024	2025-08-08 16:55:05.024	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gtbr000f3zbynz1voopz	contractor@propertyai.com	$2b$10$wQaPj/4o3tnY5AqoqpS1i.H2OX6JSWMbpccjkfOzFpM3r7jcLEpPW	John	Contractor	555-111-2222	VENDOR	2025-08-08 16:55:05.079	2025-08-08 16:55:05.079	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gtdb000g3zby7tbsdgfc	plumber@propertyai.com	$2b$10$pfwRFRe5fze2.vR2jjTuBex76JdwQw14J7vdxpBeghzdUV7Eo9V7a	Mike	Plumber	555-222-3333	VENDOR	2025-08-08 16:55:05.136	2025-08-08 16:55:05.136	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gtev000h3zbyizzndz9b	electrician@propertyai.com	$2b$10$yLi5Vk5/siSZOwzSKsKmVegZJnH8ANS5Z1VbfVc5AYhsDvRZTR5Ea	Sarah	Electrician	555-333-4444	VENDOR	2025-08-08 16:55:05.191	2025-08-08 16:55:05.191	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gtgf000i3zbyxyy46amh	john.tenant@example.com	$2b$10$jsrh4khSQzDmgZIwIlQFQ.IOM/F1UkziMWE4Cs4a7mfbGht17T0vq	John	Smith	555-456-7890	TENANT	2025-08-08 16:55:05.247	2025-08-08 16:55:05.247	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gthy000j3zby2930igrz	emma.tenant@example.com	$2b$10$5Z73PU7ZVS1inCeZ2PnMiefYeuo05ZLj128NP29RmcO1SLfqnTviq	Emma	Davis	555-567-8901	TENANT	2025-08-08 16:55:05.303	2025-08-08 16:55:05.303	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gtjj000k3zbyg1cy3j0z	david.tenant@example.com	$2b$10$2sxaX6cPCeGYlWZX9cl1Y.y4xvLUNu65.lU92K3kiTEgAYlxNk1OO	David	Wilson	555-678-9012	TENANT	2025-08-08 16:55:05.359	2025-08-08 16:55:05.359	t	f	\N	\N	\N	0	f	\N	\N	\N	\N	\N	\N	\N
cme32gt6q000c3zbymux3h5ki	admin@propertyai.com	$2b$10$qN7uggbPZIN5UX0STAXaf.QhOjeNnZcB762PvjUvo1nalveEvN4DK	Admin	User	555-123-4567	ADMIN	2025-08-08 16:55:04.898	2025-09-08 16:41:56.449	t	f	\N	\N	\N	0	f	\N	\N	\N	2025-09-08 16:41:56.431	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZTMyZ3Q2cTAwMGMzemJ5bXV4M2g1a2kiLCJlbWFpbCI6ImFkbWluQHByb3BlcnR5YWkuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3NTczNDk3MTYsImV4cCI6MTc1Nzk1NDUxNn0.EHpzZ4_7UoCoP3yEh8VMiFJPVTCB7U7ZjCgSSY9xjpw	\N	\N
\.


--
-- Data for Name: Vendor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Vendor" (id, name, "contactPersonId", phone, email, address, specialty, "createdAt", "updatedAt", certifications, "hourlyRate", "serviceAreas", workload, latitude, longitude, "standardRate", availability, "stripeAccountId") FROM stdin;
cme32gtpq000q3zbya67r6hxv	John Contractor	cme32gtbr000f3zbynz1voopz	555-111-2222	contractor@propertyai.com	123 Contractor St, City, State 12345	GENERAL_MAINTENANCE	2025-08-08 16:55:05.583	2025-08-08 16:55:05.583	{Licensed,Insured}	75	{Downtown,Suburbs}	0	\N	\N	\N	AVAILABLE	\N
cme32gtps000s3zby6rj0q5dk	Mike Plumber	cme32gtdb000g3zby7tbsdgfc	555-222-3333	plumber@propertyai.com	123 Contractor St, City, State 12345	PLUMBING	2025-08-08 16:55:05.584	2025-08-08 16:55:05.584	{Licensed,Insured}	75	{Downtown,Suburbs}	0	\N	\N	\N	AVAILABLE	\N
cme32gtps000u3zby8mh9wx4x	Sarah Electrician	cme32gtev000h3zbyizzndz9b	555-333-4444	electrician@propertyai.com	123 Contractor St, City, State 12345	ELECTRICAL	2025-08-08 16:55:05.585	2025-08-08 16:55:05.585	{Licensed,Insured}	75	{Downtown,Suburbs}	0	\N	\N	\N	AVAILABLE	\N
\.


--
-- Data for Name: VendorPayment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VendorPayment" (id, amount, status, "workOrderId", "vendorId", "transactionId", "createdAt", "updatedAt", "approvedById", "paymentDate") FROM stdin;
\.


--
-- Data for Name: VendorPerformanceRating; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VendorPerformanceRating" (id, "vendorId", "workOrderId", "ratedById", comment, "createdAt", rating, "updatedAt") FROM stdin;
\.


--
-- Data for Name: WhiteLabelConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WhiteLabelConfig" (id, "createdAt", "updatedAt", platform, token, "userId", "appName", "logoUrl", "primaryColor", "secondaryColor") FROM stdin;
\.


--
-- Data for Name: WorkOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkOrder" (id, title, description, status, priority, "createdAt", "updatedAt", "completedAt", "maintenanceRequestId") FROM stdin;
\.


--
-- Data for Name: WorkOrderAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkOrderAssignment" (id, "workOrderId", "vendorId", "assignedAt", notes) FROM stdin;
\.


--
-- Data for Name: WorkOrderQuote; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WorkOrderQuote" (id, "workOrderId", "vendorId", amount, details, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _PermissionToRole; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_PermissionToRole" ("A", "B") FROM stdin;
cme32gt4m00003zbym5oa3x7p	cme32gt4q00083zbytyzppujn
cme32gt4n00013zbyh5d11mqj	cme32gt4q00083zbytyzppujn
cme32gt4n00023zbyc3xlp61e	cme32gt4q00083zbytyzppujn
cme32gt4n00033zbyjjk8yjui	cme32gt4q00083zbytyzppujn
cme32gt4n00043zbyt6ns8jlv	cme32gt4q00083zbytyzppujn
cme32gt4n00053zbygxoakt3e	cme32gt4q00083zbytyzppujn
cme32gt4n00063zbyt86r6dz0	cme32gt4q00083zbytyzppujn
cme32gt4n00073zbybqksbcss	cme32gt4q00083zbytyzppujn
cme32gt4n00043zbyt6ns8jlv	cme32gt4v00093zby1bk2ehpi
cme32gt4n00053zbygxoakt3e	cme32gt4v00093zby1bk2ehpi
cme32gt4n00063zbyt86r6dz0	cme32gt4v00093zby1bk2ehpi
cme32gt4n00073zbybqksbcss	cme32gt4v00093zby1bk2ehpi
cme32gt4n00053zbygxoakt3e	cme32gt4w000a3zbyzzqm4vgg
cme32gt4n00053zbygxoakt3e	cme32gt4y000b3zbyu59d4erp
\.


--
-- Data for Name: _RentalWhiteLabelConfigs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_RentalWhiteLabelConfigs" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _RoleToUser; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_RoleToUser" ("A", "B") FROM stdin;
cme32gt4q00083zbytyzppujn	cme32gt6q000c3zbymux3h5ki
cme32gt4v00093zby1bk2ehpi	cme32gt8n000d3zbyzl92o49b
cme32gt4v00093zby1bk2ehpi	cme32gta7000e3zbyyysaznaf
cme32gt4y000b3zbyu59d4erp	cme32gtbr000f3zbynz1voopz
cme32gt4y000b3zbyu59d4erp	cme32gtdb000g3zby7tbsdgfc
cme32gt4y000b3zbyu59d4erp	cme32gtev000h3zbyizzndz9b
cme32gt4w000a3zbyzzqm4vgg	cme32gtgf000i3zbyxyy46amh
cme32gt4w000a3zbyzzqm4vgg	cme32gthy000j3zby2930igrz
cme32gt4w000a3zbyzzqm4vgg	cme32gtjj000k3zbyg1cy3j0z
cme32gt4w000a3zbyzzqm4vgg	cme32gtl2000l3zbyvmek7zrw
cme32gt4w000a3zbyzzqm4vgg	cme32gtml000m3zbybeybwvjm
cme32gt4w000a3zbyzzqm4vgg	cme32gto4000n3zbynummp2dr
cme32gt4w000a3zbyzzqm4vgg	cme32gtpo000o3zbybi50ukyg
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
95eb784a-bb77-4da1-bc88-894d2ce46d67	050789b1bf224c1ce0e913641d3a7fa194f9868d6df5ccd1de947e0a32a776e1	2025-08-03 16:55:32.944012-06	20250608195426_add_tenant_issue_prediction	\N	\N	2025-08-03 16:55:32.941205-06	1
f85923dc-ab95-4d92-ab0e-49a2ffd4747d	38f3a4be688fda66a5dc59accc5e728582dcad8ab2f7910afd0551689323ce09	2025-08-03 16:55:32.812701-06	20240609_add_db_optimization_logs	\N	\N	2025-08-03 16:55:32.809378-06	1
d4ef3064-19d8-4924-8b11-2eb51dda9afc	aa8f2681a17b02731f1abf2c765d26bea2d36ffe5164aff138811c23e96be800	2025-08-03 16:55:32.883747-06	20250608133704_add_audit_entry_model	\N	\N	2025-08-03 16:55:32.881076-06	1
0e15a111-d621-4d04-b560-e2ec46bd0369	71a01619fa38904e7a73f1d2126c8f3bf04717503cd189f3b8691a573599872b	2025-08-03 16:55:32.835958-06	20250608000122_initial_schema	\N	\N	2025-08-03 16:55:32.813224-06	1
09a335e4-1175-42ec-aa12-090f94bb0a86	7ead668a7ef268509d66c1f7909b9a3deabbd1513b7bdace3c52245735d2b62a	2025-08-03 16:55:32.83786-06	20250608042305_add_mfa_fields	\N	\N	2025-08-03 16:55:32.836469-06	1
604023ed-d433-4a0c-b65f-2a8b9fc29624	55d1a29d2cedc5eba3d3c052a9657ec417a918a8dfcca075e56c2bef8348c033	2025-08-03 16:55:32.912277-06	20250608161412_add_photo_analysis	\N	\N	2025-08-03 16:55:32.909225-06	1
979d262d-8309-47ea-9d1a-6f6b478dc388	48b6200a4dbe5e971be2d810add4fade8a1a7cb00a532a52e18916799f7595b9	2025-08-03 16:55:32.845628-06	20250608045159_add_listing_and_marketing_models	\N	\N	2025-08-03 16:55:32.838347-06	1
6afb13b6-7965-4c61-99b6-f2911a51ec9c	bc2d06ac224f3f34bd4b46f2f32790f719c27dce73e9c76e9ca6d807f7102ad8	2025-08-03 16:55:32.885982-06	20250608134129_add_leases_to_user	\N	\N	2025-08-03 16:55:32.884075-06	1
9b170468-e361-43e0-8383-165c23d15095	2172df81003fd7a77a9e948382fd051e55473610bfe786c0acae93cd5a3958cf	2025-08-03 16:55:32.848141-06	20250608051722_added_listing_model	\N	\N	2025-08-03 16:55:32.846078-06	1
fbc2fed1-817b-425d-8da0-eeac8de1e29c	f593a9784ae2652d7095be91b9af844f4049cd49ae910e9122e944a0dc8333d3	2025-08-03 16:55:32.85697-06	20250608054710_add_application_model	\N	\N	2025-08-03 16:55:32.848629-06	1
2e301bf8-0abe-4ada-a8a2-8720112827b6	e44b2e76e290a57fda3fb2c44b9e77c5319c24e97830dde87198776fb135a10c	2025-08-03 16:55:32.860012-06	20250608060128_add_market_data_model	\N	\N	2025-08-03 16:55:32.857398-06	1
45d17938-9c96-4948-9b60-6d6632720f6c	2e45d6fab33351402bfa67a851ea7f02b61416f8da0e6595c29e5d2489711b4c	2025-08-03 16:55:32.888058-06	20250608153231_add_lockout_fields	\N	\N	2025-08-03 16:55:32.886457-06	1
b092f9dd-21ad-470b-9640-e23ff13e50d8	1d6054bdee5ed5626cb4b7b7a18c9bbefbca1b64048dc04b878097dd999bd7fd	2025-08-03 16:55:32.863733-06	20250608060602_add_oauth_connection_model	\N	\N	2025-08-03 16:55:32.860403-06	1
912b8560-3de5-4b2a-86a5-3c2459cb3bd2	c675a254cad1ca8466a2bb6fd47ed523a69363989b3e9d29f0247c119927278d	2025-08-03 16:55:32.865344-06	20250608061233_add_password_reset_fields	\N	\N	2025-08-03 16:55:32.864088-06	1
0eb46195-1f34-456c-9a85-fe2fbf48dc9e	7d93103b1fbe5cf1eae261b97c7f83d13569b5ee254211416b682cb282ab640b	2025-08-03 16:55:32.93404-06	20250608193248_add_scheduled_event	\N	\N	2025-08-03 16:55:32.93114-06	1
e56930d7-d57c-4da7-8780-d9235e3aada2	d32971dd879735836b1243b75a038f6c12761da658900e6e0c2aa402bc7351ec	2025-08-03 16:55:32.868091-06	20250608062012_add_ai_image_analysis_model	\N	\N	2025-08-03 16:55:32.865708-06	1
36f361ca-e963-4de3-8e2d-16055912915d	6b00ae9bee34c4fdab9cca61d2e28224adcb15b8b1803d412c0c22cef53f957a	2025-08-03 16:55:32.89641-06	20250608154734_add_maintenance_management	\N	\N	2025-08-03 16:55:32.888583-06	1
442b4922-8677-490e-b732-7822e532721c	7c3f5fb9cc3b004d2e9da7810ecc50ae13f204fb3d4678cd15131fe9c1aae95c	2025-08-03 16:55:32.872888-06	20250608072029_add_knowledge_base_entry	\N	\N	2025-08-03 16:55:32.86841-06	1
696eb234-4d0f-458e-8a1d-58b5d6f35739	d3f8526db0a34ec1a89d68fdf3eb6933d218b6a3c3b3e2435bd79ebb9c4b9172	2025-08-03 16:55:32.877664-06	20250608074507_add_vendor_performance_models	\N	\N	2025-08-03 16:55:32.873403-06	1
11c53acf-935c-4854-b9e7-ae131959485e	7e1a197033b31520c30f12445f868cdf46badbb8181145f535cdd6f86e1ead6f	2025-08-03 16:55:32.917948-06	20250608174917_add_communications_schema	\N	\N	2025-08-03 16:55:32.913049-06	1
5d9c427f-6295-4cd9-9e0d-573c7b6822fa	1923b836be915deeb9969c2d282dd84d0e6ba07904db383c3327d079986d600e	2025-08-03 16:55:32.880717-06	20250608133515_add_background_check_model	\N	\N	2025-08-03 16:55:32.878084-06	1
4b930ec8-c4f7-42f7-9763-5105b5083374	3aa9fc5e9c59f80c6b846f41df02694fb888e0ca80a8c1100e31ad8e807674c6	2025-08-03 16:55:32.899163-06	20250608155902_add_social_media_platform_config	\N	\N	2025-08-03 16:55:32.896889-06	1
054013ba-74da-440c-8297-81324fa2e9fa	42f0226a4be95ad0bf6b89c8a8780cf50251cd849b17e78c6eda3fa90dacb65b	2025-08-03 16:55:32.902844-06	20250608160439_add_predictive_maintenance	\N	\N	2025-08-03 16:55:32.899711-06	1
032ec2f3-9cfb-4dde-80e0-52d771afba71	44a2d53701e48234ab73038bcba885842c8c250a93b022eb6d75000f67b3b97f	2025-08-03 16:55:32.904859-06	20250608160620_add_listing_slug	\N	\N	2025-08-03 16:55:32.903277-06	1
e53519b2-99c8-4e09-9946-80013812d76d	ef3e9f1a0841b6618a1cee25e0750f47697fe48b97d3215ade86e2e97259738b	2025-08-03 16:55:32.923032-06	20250608191629_add_maintenance_request_category_and_photo_analysis	\N	\N	2025-08-03 16:55:32.918389-06	1
7c47cf51-74e3-4d4b-8285-c92085362c98	bb79b53c5a08ee5cb87cf406ab545676b374291f5b34a87db7ba1180c11b525b	2025-08-03 16:55:32.908785-06	20250608160748_add_cost_estimation	\N	\N	2025-08-03 16:55:32.90537-06	1
f35e483e-f178-46af-b08a-07f0b404d8dd	bf1f2a6ef9d3c9ea2310f95617ac3fe57874b33e222d27d7d5cacd934fb37c47	2025-08-03 16:55:32.926842-06	20250608192046_add_emergency_routing_rule	\N	\N	2025-08-03 16:55:32.92344-06	1
d8569892-da73-4d9c-85bd-e1d61f88175d	f5a3c2bf6c74fd910bac21807a6b75bfd3ee804126ba1a54c59e42e28b86b1b6	2025-08-03 16:55:32.937231-06	20250608193839_add_screening_model	\N	\N	2025-08-03 16:55:32.934354-06	1
7c1377d6-8b9a-4e03-9692-d3c25903b31c	b44c57c13e0a99f85e8b51076f993b1b936f6005b94c4b9fa6777a89d3668779	2025-08-03 16:55:32.930719-06	20250608192627_add_maintenance_response_time	\N	\N	2025-08-03 16:55:32.927404-06	1
73cffa23-4e0c-4944-bccf-c11d30596d5a	976ae712a1584e387bf3ca7bd8adb07dc5b7c223bb85aed118c769294abd6832	2025-08-03 16:55:32.983539-06	20250610143448_vendor_routing_fields	\N	\N	2025-08-03 16:55:32.978333-06	1
862a6047-efd0-4d7b-865b-a82499f80c81	a99d63de32902b50db66606464bd6c0fd190aa2c3fca80488d5179c4c6af1f99	2025-08-03 16:55:32.940801-06	20250608194114_add_risk_assessment_model	\N	\N	2025-08-03 16:55:32.93775-06	1
e63fe419-a219-4d23-89fb-239dc06e08e6	e5e25b068f90e0ec2043447645acba912c0bbf47758db07eb90284ff9973ef69	2025-08-03 16:55:32.977969-06	20250609210334_added_indexes	\N	\N	2025-08-03 16:55:32.975184-06	1
99380375-0570-4b04-9e92-212bf21ac4d4	0d437d960ee5ffcfb1a5904cafd44a1859babcdf448171638ff1f7b4aa084182	2025-08-03 16:55:32.969696-06	20250609190911_add_db_optimization_logs	\N	\N	2025-08-03 16:55:32.94458-06	1
9fd1ecce-cc79-4083-be16-83b63913e55b	8024d93efd6399eab27cd9694289fd59f43994f8725992fbd1b1bda59cb46adf	2025-08-03 16:55:32.974788-06	20250609200203_add_performance_indexes	\N	\N	2025-08-03 16:55:32.970101-06	1
5f682d90-041d-4ab6-8ab3-991811925cc2	8400d9b5e0513c33a4b48dfb83e813d2ee889bdfd1d49fd6b01c2fb85faf5da8	2025-08-03 16:55:32.986737-06	20250610144416_model_performance_tracking	\N	\N	2025-08-03 16:55:32.983949-06	1
968f2f79-4069-49a6-a66a-fded8b5e3103	3c60151ac2904938f0105e04802be3e7ba385960e8bc0caf52a219a6d1cc8bbf	2025-08-03 16:55:32.988241-06	20250714193355_add_user_settings	\N	\N	2025-08-03 16:55:32.987111-06	1
62b0dca6-b35b-4dc1-a57c-14734acbe0bb	6df650a601467be6c2805570a42dfb08555b6b4f9d8431ebba3200883042f217	2025-08-03 16:55:32.989792-06	20250714195247_sync	\N	\N	2025-08-03 16:55:32.988568-06	1
5ec827d1-47e2-48d6-bfc4-62b7b67acc58	80e88563e1bce2ab4b91d5a7e354f1e6664951af02e1c55f600765dc6c576619	2025-08-03 16:55:32.991074-06	20250716153648_add_refresh_token	\N	\N	2025-08-03 16:55:32.990213-06	1
65e6e0de-3baf-4b0c-ad5a-759660f8b241	e051f7843c132a764e215f537fd0218dd0ecbbc46726b8594350f26789530e45	2025-08-03 16:55:32.992871-06	20250716180000_make_unit_id_optional	\N	\N	2025-08-03 16:55:32.991543-06	1
6f81ca61-1bdb-4100-8374-aa2d617eb19c	49da25fde648f7dada30eda359bb664e976dca140f165df3e4f43656fe048269	2025-08-03 16:55:32.997335-06	20250723225935_add_conversation_id_to_message	\N	\N	2025-08-03 16:55:32.993472-06	1
461b8392-5cd8-4120-9900-dd360a0ea33b	140ce8daf1c5cf1e5aac49e000f1962b28a7befd70f9ccd637de541bc86f2b11	2025-08-03 16:55:33.00321-06	20250724172811_add_device_and_stripe_customer_id	\N	\N	2025-08-03 16:55:32.997871-06	1
d6fd741e-dd51-4597-9d7d-dbe4bceb8854	1c98a34babe7a5cda6be2b4082fc5c1ef95ccaffaa794b1ea75ca2d0c45b8f9d	2025-08-03 16:55:33.004932-06	20250724173017_add_push_token_to_user	\N	\N	2025-08-03 16:55:33.003726-06	1
693d2720-acc7-47ec-b378-ed83a7c6d498	3d14f865c8c3e1130d21bb81c35f023507f6f0b3f0e8f3ba0572873ba61e137b	2025-08-03 16:55:33.054486-06	20250724211924_add_vendor_payment	\N	\N	2025-08-03 16:55:33.006299-06	1
52dd30b5-8522-4fbb-82a2-40559ccd894c	6d5f6c223077c8b10e08b9370c53cbc1995559d0c6b444b3f80872cf12a96146	2025-08-03 16:55:33.057908-06	20250724213915_add_payment_approval_status	\N	\N	2025-08-03 16:55:33.055105-06	1
2ff0e50f-d909-4fc2-8d77-ca304125ccdd	584d3d5993a2f21a4fdd241235e63f57099163029b18ffd2921015dde5e0c5b7	2025-08-03 16:55:33.059396-06	20250724214305_add_owner_role	\N	\N	2025-08-03 16:55:33.058476-06	1
0121f6e2-9295-4816-9a4e-3455faafc9ca	b54317af7dcd493b41c5a5cead76449391d962d817ad6f8b3abb2697e020ad66	2025-08-03 16:55:33.117578-06	20250731202145_add_listing_images	\N	\N	2025-08-03 16:55:33.060349-06	1
8d3a7465-3078-43bd-a6ac-d250eda1b322	e843d175544d5e6b3049016838dee628d1b3ce60442e472fe6d0a6f5438c24a0	2025-08-03 16:55:33.163616-06	20250802_consolidate_to_rental	\N	\N	2025-08-03 16:55:33.118315-06	1
b9782f2b-615e-4b02-a31a-e89c34318bc5	f9802f2f76d5036393d1d2fa7dc4bed033bbb4506c2c97c096a7d62286f9112e	2025-08-04 09:56:18.323756-06	20250804155618_rental	\N	\N	2025-08-04 09:56:18.293047-06	1
\.


--
-- Name: RentalImage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."RentalImage_id_seq"', 1, false);


--
-- Name: AIImageAnalysis AIImageAnalysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AIImageAnalysis"
    ADD CONSTRAINT "AIImageAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: AIUsageLog AIUsageLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AIUsageLog"
    ADD CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY (id);


--
-- Name: ApiKey ApiKey_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_pkey" PRIMARY KEY (id);


--
-- Name: Appliance Appliance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appliance"
    ADD CONSTRAINT "Appliance_pkey" PRIMARY KEY (id);


--
-- Name: Application Application_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);


--
-- Name: AuditEntry AuditEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditEntry"
    ADD CONSTRAINT "AuditEntry_pkey" PRIMARY KEY (id);


--
-- Name: BackgroundCheck BackgroundCheck_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BackgroundCheck"
    ADD CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY (id);


--
-- Name: BusinessHours BusinessHours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusinessHours"
    ADD CONSTRAINT "BusinessHours_pkey" PRIMARY KEY (id);


--
-- Name: Consent Consent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Consent"
    ADD CONSTRAINT "Consent_pkey" PRIMARY KEY (id);


--
-- Name: CostEstimation CostEstimation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CostEstimation"
    ADD CONSTRAINT "CostEstimation_pkey" PRIMARY KEY (id);


--
-- Name: Device Device_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Device"
    ADD CONSTRAINT "Device_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmergencyProtocol EmergencyProtocol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmergencyProtocol"
    ADD CONSTRAINT "EmergencyProtocol_pkey" PRIMARY KEY (id);


--
-- Name: EmergencyRoutingRule EmergencyRoutingRule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmergencyRoutingRule"
    ADD CONSTRAINT "EmergencyRoutingRule_pkey" PRIMARY KEY (id);


--
-- Name: EscalationPolicyRule EscalationPolicyRule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscalationPolicyRule"
    ADD CONSTRAINT "EscalationPolicyRule_pkey" PRIMARY KEY (id);


--
-- Name: EscalationPolicy EscalationPolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscalationPolicy"
    ADD CONSTRAINT "EscalationPolicy_pkey" PRIMARY KEY (id);


--
-- Name: FollowUp FollowUp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FollowUp"
    ADD CONSTRAINT "FollowUp_pkey" PRIMARY KEY (id);


--
-- Name: KnowledgeBaseEntry KnowledgeBaseEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."KnowledgeBaseEntry"
    ADD CONSTRAINT "KnowledgeBaseEntry_pkey" PRIMARY KEY (id);


--
-- Name: Language Language_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Language"
    ADD CONSTRAINT "Language_pkey" PRIMARY KEY (id);


--
-- Name: Lease Lease_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lease"
    ADD CONSTRAINT "Lease_pkey" PRIMARY KEY (id);


--
-- Name: Lease Lease_rentalId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lease"
    ADD CONSTRAINT "Lease_rentalId_key" UNIQUE ("rentalId");


--
-- Name: MaintenanceRequestCategory MaintenanceRequestCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaintenanceRequestCategory"
    ADD CONSTRAINT "MaintenanceRequestCategory_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceRequest MaintenanceRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY (id);


--
-- Name: MaintenanceResponseTime MaintenanceResponseTime_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaintenanceResponseTime"
    ADD CONSTRAINT "MaintenanceResponseTime_pkey" PRIMARY KEY (id);


--
-- Name: MarketData MarketData_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MarketData"
    ADD CONSTRAINT "MarketData_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OAuthAccessToken OAuthAccessToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OAuthAccessToken"
    ADD CONSTRAINT "OAuthAccessToken_pkey" PRIMARY KEY (id);


--
-- Name: OAuthConnection OAuthConnection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OAuthConnection"
    ADD CONSTRAINT "OAuthConnection_pkey" PRIMARY KEY (id);


--
-- Name: OnCallRotation OnCallRotation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnCallRotation"
    ADD CONSTRAINT "OnCallRotation_pkey" PRIMARY KEY (id);


--
-- Name: OnCallSchedule OnCallSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnCallSchedule"
    ADD CONSTRAINT "OnCallSchedule_pkey" PRIMARY KEY (id);


--
-- Name: PasswordResetToken PasswordResetToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: PhotoAnalysis PhotoAnalysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PhotoAnalysis"
    ADD CONSTRAINT "PhotoAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: PredictiveMaintenance PredictiveMaintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PredictiveMaintenance"
    ADD CONSTRAINT "PredictiveMaintenance_pkey" PRIMARY KEY (id);


--
-- Name: RentalImage RentalImage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RentalImage"
    ADD CONSTRAINT "RentalImage_pkey" PRIMARY KEY (id);


--
-- Name: Rental Rental_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_pkey" PRIMARY KEY (id);


--
-- Name: RiskAssessment RiskAssessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RiskAssessment"
    ADD CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: ScheduledEvent ScheduledEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScheduledEvent"
    ADD CONSTRAINT "ScheduledEvent_pkey" PRIMARY KEY (id);


--
-- Name: Screening Screening_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Screening"
    ADD CONSTRAINT "Screening_pkey" PRIMARY KEY (id);


--
-- Name: TenantIssuePrediction TenantIssuePrediction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TenantIssuePrediction"
    ADD CONSTRAINT "TenantIssuePrediction_pkey" PRIMARY KEY (id);


--
-- Name: TenantRating TenantRating_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TenantRating"
    ADD CONSTRAINT "TenantRating_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: UXReviewAssignment UXReviewAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXReviewAssignment"
    ADD CONSTRAINT "UXReviewAssignment_pkey" PRIMARY KEY (id);


--
-- Name: UXReviewComment UXReviewComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXReviewComment"
    ADD CONSTRAINT "UXReviewComment_pkey" PRIMARY KEY (id);


--
-- Name: UXReview UXReview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXReview"
    ADD CONSTRAINT "UXReview_pkey" PRIMARY KEY (id);


--
-- Name: UXSurveyAnswer UXSurveyAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurveyAnswer"
    ADD CONSTRAINT "UXSurveyAnswer_pkey" PRIMARY KEY (id);


--
-- Name: UXSurveyQuestion UXSurveyQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurveyQuestion"
    ADD CONSTRAINT "UXSurveyQuestion_pkey" PRIMARY KEY (id);


--
-- Name: UXSurveyResponse UXSurveyResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurveyResponse"
    ADD CONSTRAINT "UXSurveyResponse_pkey" PRIMARY KEY (id);


--
-- Name: UXSurvey UXSurvey_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurvey"
    ADD CONSTRAINT "UXSurvey_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VendorPayment VendorPayment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendorPayment"
    ADD CONSTRAINT "VendorPayment_pkey" PRIMARY KEY (id);


--
-- Name: VendorPerformanceRating VendorPerformanceRating_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendorPerformanceRating"
    ADD CONSTRAINT "VendorPerformanceRating_pkey" PRIMARY KEY (id);


--
-- Name: Vendor Vendor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vendor"
    ADD CONSTRAINT "Vendor_pkey" PRIMARY KEY (id);


--
-- Name: WhiteLabelConfig WhiteLabelConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WhiteLabelConfig"
    ADD CONSTRAINT "WhiteLabelConfig_pkey" PRIMARY KEY (id);


--
-- Name: WorkOrderAssignment WorkOrderAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkOrderAssignment"
    ADD CONSTRAINT "WorkOrderAssignment_pkey" PRIMARY KEY (id);


--
-- Name: WorkOrderQuote WorkOrderQuote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkOrderQuote"
    ADD CONSTRAINT "WorkOrderQuote_pkey" PRIMARY KEY (id);


--
-- Name: WorkOrder WorkOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AIImageAnalysis_imageId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AIImageAnalysis_imageId_key" ON public."AIImageAnalysis" USING btree ("imageId");


--
-- Name: AIUsageLog_toolName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AIUsageLog_toolName_idx" ON public."AIUsageLog" USING btree ("toolName");


--
-- Name: AIUsageLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AIUsageLog_userId_idx" ON public."AIUsageLog" USING btree ("userId");


--
-- Name: ApiKey_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ApiKey_key_key" ON public."ApiKey" USING btree (key);


--
-- Name: ApiKey_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ApiKey_userId_idx" ON public."ApiKey" USING btree ("userId");


--
-- Name: Appliance_rentalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appliance_rentalId_idx" ON public."Appliance" USING btree ("rentalId");


--
-- Name: Application_rentalId_applicantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Application_rentalId_applicantId_key" ON public."Application" USING btree ("rentalId", "applicantId");


--
-- Name: Application_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Application_status_idx" ON public."Application" USING btree (status);


--
-- Name: AuditEntry_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditEntry_entityId_idx" ON public."AuditEntry" USING btree ("entityId");


--
-- Name: AuditEntry_entityType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditEntry_entityType_idx" ON public."AuditEntry" USING btree ("entityType");


--
-- Name: AuditEntry_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditEntry_userId_idx" ON public."AuditEntry" USING btree ("userId");


--
-- Name: BackgroundCheck_applicantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BackgroundCheck_applicantId_idx" ON public."BackgroundCheck" USING btree ("applicantId");


--
-- Name: BackgroundCheck_applicantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BackgroundCheck_applicantId_key" ON public."BackgroundCheck" USING btree ("applicantId");


--
-- Name: BusinessHours_rentalId_dayOfWeek_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BusinessHours_rentalId_dayOfWeek_key" ON public."BusinessHours" USING btree ("rentalId", "dayOfWeek");


--
-- Name: Consent_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Consent_userId_idx" ON public."Consent" USING btree ("userId");


--
-- Name: Consent_userId_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Consent_userId_type_key" ON public."Consent" USING btree ("userId", type);


--
-- Name: CostEstimation_workOrderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CostEstimation_workOrderId_key" ON public."CostEstimation" USING btree ("workOrderId");


--
-- Name: Device_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Device_userId_idx" ON public."Device" USING btree ("userId");


--
-- Name: EmergencyRoutingRule_priority_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmergencyRoutingRule_priority_key" ON public."EmergencyRoutingRule" USING btree (priority);


--
-- Name: EmergencyRoutingRule_vendorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EmergencyRoutingRule_vendorId_idx" ON public."EmergencyRoutingRule" USING btree ("vendorId");


--
-- Name: EscalationPolicyRule_policyId_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EscalationPolicyRule_policyId_order_key" ON public."EscalationPolicyRule" USING btree ("policyId", "order");


--
-- Name: FollowUp_messageId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FollowUp_messageId_key" ON public."FollowUp" USING btree ("messageId");


--
-- Name: KnowledgeBaseEntry_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "KnowledgeBaseEntry_category_idx" ON public."KnowledgeBaseEntry" USING btree (category);


--
-- Name: Language_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Language_code_key" ON public."Language" USING btree (code);


--
-- Name: MaintenanceRequestCategory_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MaintenanceRequestCategory_name_key" ON public."MaintenanceRequestCategory" USING btree (name);


--
-- Name: MaintenanceRequest_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MaintenanceRequest_priority_idx" ON public."MaintenanceRequest" USING btree (priority);


--
-- Name: MaintenanceRequest_rentalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MaintenanceRequest_rentalId_idx" ON public."MaintenanceRequest" USING btree ("rentalId");


--
-- Name: MaintenanceRequest_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MaintenanceRequest_status_idx" ON public."MaintenanceRequest" USING btree (status);


--
-- Name: MaintenanceResponseTime_maintenanceRequestId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MaintenanceResponseTime_maintenanceRequestId_key" ON public."MaintenanceResponseTime" USING btree ("maintenanceRequestId");


--
-- Name: MarketData_dataDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MarketData_dataDate_idx" ON public."MarketData" USING btree ("dataDate");


--
-- Name: MarketData_location_dataDate_propertyType_bedrooms_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MarketData_location_dataDate_propertyType_bedrooms_key" ON public."MarketData" USING btree (location, "dataDate", "propertyType", bedrooms);


--
-- Name: MarketData_location_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MarketData_location_idx" ON public."MarketData" USING btree (location);


--
-- Name: Message_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_category_idx" ON public."Message" USING btree (category);


--
-- Name: Message_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_conversationId_idx" ON public."Message" USING btree ("conversationId");


--
-- Name: Message_isEarlyWarning_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_isEarlyWarning_idx" ON public."Message" USING btree ("isEarlyWarning");


--
-- Name: Message_receiverId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_receiverId_idx" ON public."Message" USING btree ("receiverId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: Message_sentiment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_sentiment_idx" ON public."Message" USING btree (sentiment);


--
-- Name: Notification_isRead_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_isRead_idx" ON public."Notification" USING btree ("isRead");


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: OAuthAccessToken_accessToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OAuthAccessToken_accessToken_key" ON public."OAuthAccessToken" USING btree ("accessToken");


--
-- Name: OAuthConnection_provider_providerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OAuthConnection_provider_providerId_key" ON public."OAuthConnection" USING btree (provider, "providerId");


--
-- Name: OAuthConnection_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OAuthConnection_userId_idx" ON public."OAuthConnection" USING btree ("userId");


--
-- Name: PasswordResetToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON public."PasswordResetToken" USING btree (token);


--
-- Name: Permission_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Permission_name_key" ON public."Permission" USING btree (name);


--
-- Name: PhotoAnalysis_maintenanceRequestId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PhotoAnalysis_maintenanceRequestId_key" ON public."PhotoAnalysis" USING btree ("maintenanceRequestId");


--
-- Name: PredictiveMaintenance_rentalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PredictiveMaintenance_rentalId_idx" ON public."PredictiveMaintenance" USING btree ("rentalId");


--
-- Name: RentalImage_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RentalImage_isFeatured_idx" ON public."RentalImage" USING btree ("isFeatured");


--
-- Name: RentalImage_rentalId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RentalImage_rentalId_idx" ON public."RentalImage" USING btree ("rentalId");


--
-- Name: Rental_city_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_city_idx" ON public."Rental" USING btree (city);


--
-- Name: Rental_isAvailable_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_isAvailable_idx" ON public."Rental" USING btree ("isAvailable");


--
-- Name: Rental_managerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_managerId_idx" ON public."Rental" USING btree ("managerId");


--
-- Name: Rental_ownerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_ownerId_idx" ON public."Rental" USING btree ("ownerId");


--
-- Name: Rental_propertyType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_propertyType_idx" ON public."Rental" USING btree ("propertyType");


--
-- Name: Rental_rent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_rent_idx" ON public."Rental" USING btree (rent);


--
-- Name: Rental_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Rental_slug_key" ON public."Rental" USING btree (slug);


--
-- Name: Rental_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_state_idx" ON public."Rental" USING btree (state);


--
-- Name: Rental_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_status_idx" ON public."Rental" USING btree (status);


--
-- Name: Rental_zipCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Rental_zipCode_idx" ON public."Rental" USING btree ("zipCode");


--
-- Name: RiskAssessment_applicationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RiskAssessment_applicationId_idx" ON public."RiskAssessment" USING btree ("applicationId");


--
-- Name: RiskAssessment_applicationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RiskAssessment_applicationId_key" ON public."RiskAssessment" USING btree ("applicationId");


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: ScheduledEvent_workOrderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ScheduledEvent_workOrderId_key" ON public."ScheduledEvent" USING btree ("workOrderId");


--
-- Name: Screening_applicationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Screening_applicationId_idx" ON public."Screening" USING btree ("applicationId");


--
-- Name: Screening_applicationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Screening_applicationId_key" ON public."Screening" USING btree ("applicationId");


--
-- Name: TenantIssuePrediction_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TenantIssuePrediction_tenantId_idx" ON public."TenantIssuePrediction" USING btree ("tenantId");


--
-- Name: TenantRating_leaseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TenantRating_leaseId_idx" ON public."TenantRating" USING btree ("leaseId");


--
-- Name: TenantRating_overallRating_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TenantRating_overallRating_idx" ON public."TenantRating" USING btree ("overallRating");


--
-- Name: TenantRating_raterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TenantRating_raterId_idx" ON public."TenantRating" USING btree ("raterId");


--
-- Name: TenantRating_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TenantRating_tenantId_idx" ON public."TenantRating" USING btree ("tenantId");


--
-- Name: Transaction_leaseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_leaseId_idx" ON public."Transaction" USING btree ("leaseId");


--
-- Name: Transaction_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_status_idx" ON public."Transaction" USING btree (status);


--
-- Name: Transaction_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_type_idx" ON public."Transaction" USING btree (type);


--
-- Name: UXReviewAssignment_assigneeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReviewAssignment_assigneeId_idx" ON public."UXReviewAssignment" USING btree ("assigneeId");


--
-- Name: UXReviewAssignment_reviewId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReviewAssignment_reviewId_idx" ON public."UXReviewAssignment" USING btree ("reviewId");


--
-- Name: UXReviewAssignment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReviewAssignment_status_idx" ON public."UXReviewAssignment" USING btree (status);


--
-- Name: UXReviewComment_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReviewComment_authorId_idx" ON public."UXReviewComment" USING btree ("authorId");


--
-- Name: UXReviewComment_reviewId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReviewComment_reviewId_idx" ON public."UXReviewComment" USING btree ("reviewId");


--
-- Name: UXReview_componentType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReview_componentType_idx" ON public."UXReview" USING btree ("componentType");


--
-- Name: UXReview_priority_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReview_priority_idx" ON public."UXReview" USING btree (priority);


--
-- Name: UXReview_reviewerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReview_reviewerId_idx" ON public."UXReview" USING btree ("reviewerId");


--
-- Name: UXReview_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXReview_status_idx" ON public."UXReview" USING btree (status);


--
-- Name: UXSurveyAnswer_responseId_questionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UXSurveyAnswer_responseId_questionId_key" ON public."UXSurveyAnswer" USING btree ("responseId", "questionId");


--
-- Name: UXSurveyQuestion_surveyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXSurveyQuestion_surveyId_idx" ON public."UXSurveyQuestion" USING btree ("surveyId");


--
-- Name: UXSurveyResponse_respondentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXSurveyResponse_respondentId_idx" ON public."UXSurveyResponse" USING btree ("respondentId");


--
-- Name: UXSurveyResponse_surveyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXSurveyResponse_surveyId_idx" ON public."UXSurveyResponse" USING btree ("surveyId");


--
-- Name: UXSurvey_createdById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXSurvey_createdById_idx" ON public."UXSurvey" USING btree ("createdById");


--
-- Name: UXSurvey_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UXSurvey_status_idx" ON public."UXSurvey" USING btree (status);


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_isActive_idx" ON public."User" USING btree ("isActive");


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: User_stripeCustomerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON public."User" USING btree ("stripeCustomerId");


--
-- Name: VendorPayment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendorPayment_status_idx" ON public."VendorPayment" USING btree (status);


--
-- Name: VendorPayment_vendorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendorPayment_vendorId_idx" ON public."VendorPayment" USING btree ("vendorId");


--
-- Name: VendorPayment_workOrderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendorPayment_workOrderId_idx" ON public."VendorPayment" USING btree ("workOrderId");


--
-- Name: VendorPerformanceRating_ratedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendorPerformanceRating_ratedById_idx" ON public."VendorPerformanceRating" USING btree ("ratedById");


--
-- Name: VendorPerformanceRating_vendorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendorPerformanceRating_vendorId_idx" ON public."VendorPerformanceRating" USING btree ("vendorId");


--
-- Name: VendorPerformanceRating_vendorId_workOrderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VendorPerformanceRating_vendorId_workOrderId_key" ON public."VendorPerformanceRating" USING btree ("vendorId", "workOrderId");


--
-- Name: Vendor_contactPersonId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Vendor_contactPersonId_key" ON public."Vendor" USING btree ("contactPersonId");


--
-- Name: Vendor_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Vendor_email_key" ON public."Vendor" USING btree (email);


--
-- Name: Vendor_stripeAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Vendor_stripeAccountId_key" ON public."Vendor" USING btree ("stripeAccountId");


--
-- Name: WhiteLabelConfig_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WhiteLabelConfig_token_key" ON public."WhiteLabelConfig" USING btree (token);


--
-- Name: WhiteLabelConfig_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WhiteLabelConfig_userId_idx" ON public."WhiteLabelConfig" USING btree ("userId");


--
-- Name: WorkOrder_maintenanceRequestId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WorkOrder_maintenanceRequestId_key" ON public."WorkOrder" USING btree ("maintenanceRequestId");


--
-- Name: _PermissionToRole_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON public."_PermissionToRole" USING btree ("A", "B");


--
-- Name: _PermissionToRole_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_PermissionToRole_B_index" ON public."_PermissionToRole" USING btree ("B");


--
-- Name: _RentalWhiteLabelConfigs_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_RentalWhiteLabelConfigs_AB_unique" ON public."_RentalWhiteLabelConfigs" USING btree ("A", "B");


--
-- Name: _RentalWhiteLabelConfigs_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_RentalWhiteLabelConfigs_B_index" ON public."_RentalWhiteLabelConfigs" USING btree ("B");


--
-- Name: _RoleToUser_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON public."_RoleToUser" USING btree ("A", "B");


--
-- Name: _RoleToUser_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_RoleToUser_B_index" ON public."_RoleToUser" USING btree ("B");


--
-- Name: idx_tenant_ratings_overall; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenant_ratings_overall ON public."TenantRating" USING btree ("overallRating");


--
-- Name: AIUsageLog AIUsageLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AIUsageLog"
    ADD CONSTRAINT "AIUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ApiKey ApiKey_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApiKey"
    ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appliance Appliance_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appliance"
    ADD CONSTRAINT "Appliance_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_applicantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditEntry AuditEntry_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditEntry"
    ADD CONSTRAINT "AuditEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BackgroundCheck BackgroundCheck_applicantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BackgroundCheck"
    ADD CONSTRAINT "BackgroundCheck_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BusinessHours BusinessHours_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusinessHours"
    ADD CONSTRAINT "BusinessHours_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Consent Consent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Consent"
    ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CostEstimation CostEstimation_workOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CostEstimation"
    ADD CONSTRAINT "CostEstimation_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES public."WorkOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Device Device_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Device"
    ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Document Document_leaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES public."Lease"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_maintenanceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES public."MaintenanceRequest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmergencyProtocol EmergencyProtocol_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmergencyProtocol"
    ADD CONSTRAINT "EmergencyProtocol_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmergencyRoutingRule EmergencyRoutingRule_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmergencyRoutingRule"
    ADD CONSTRAINT "EmergencyRoutingRule_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EscalationPolicyRule EscalationPolicyRule_assignedToUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscalationPolicyRule"
    ADD CONSTRAINT "EscalationPolicyRule_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EscalationPolicyRule EscalationPolicyRule_policyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscalationPolicyRule"
    ADD CONSTRAINT "EscalationPolicyRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES public."EscalationPolicy"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EscalationPolicy EscalationPolicy_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscalationPolicy"
    ADD CONSTRAINT "EscalationPolicy_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FollowUp FollowUp_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FollowUp"
    ADD CONSTRAINT "FollowUp_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lease Lease_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lease"
    ADD CONSTRAINT "Lease_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lease Lease_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lease"
    ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaintenanceRequest MaintenanceRequest_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."MaintenanceRequestCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MaintenanceRequest MaintenanceRequest_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaintenanceRequest MaintenanceRequest_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaintenanceRequest"
    ADD CONSTRAINT "MaintenanceRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MaintenanceResponseTime MaintenanceResponseTime_maintenanceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaintenanceResponseTime"
    ADD CONSTRAINT "MaintenanceResponseTime_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES public."MaintenanceRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_maintenanceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES public."MaintenanceRequest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OAuthAccessToken OAuthAccessToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OAuthAccessToken"
    ADD CONSTRAINT "OAuthAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OAuthConnection OAuthConnection_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OAuthConnection"
    ADD CONSTRAINT "OAuthConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OnCallRotation OnCallRotation_scheduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnCallRotation"
    ADD CONSTRAINT "OnCallRotation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES public."OnCallSchedule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OnCallRotation OnCallRotation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnCallRotation"
    ADD CONSTRAINT "OnCallRotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OnCallSchedule OnCallSchedule_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnCallSchedule"
    ADD CONSTRAINT "OnCallSchedule_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PasswordResetToken PasswordResetToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PasswordResetToken"
    ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PhotoAnalysis PhotoAnalysis_maintenanceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PhotoAnalysis"
    ADD CONSTRAINT "PhotoAnalysis_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES public."MaintenanceRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PredictiveMaintenance PredictiveMaintenance_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PredictiveMaintenance"
    ADD CONSTRAINT "PredictiveMaintenance_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RentalImage RentalImage_rentalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RentalImage"
    ADD CONSTRAINT "RentalImage_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Rental Rental_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Rental Rental_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Rental Rental_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Rental Rental_whiteLabelConfigId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rental"
    ADD CONSTRAINT "Rental_whiteLabelConfigId_fkey" FOREIGN KEY ("whiteLabelConfigId") REFERENCES public."WhiteLabelConfig"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RiskAssessment RiskAssessment_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RiskAssessment"
    ADD CONSTRAINT "RiskAssessment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ScheduledEvent ScheduledEvent_workOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScheduledEvent"
    ADD CONSTRAINT "ScheduledEvent_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES public."WorkOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Screening Screening_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Screening"
    ADD CONSTRAINT "Screening_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenantIssuePrediction TenantIssuePrediction_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TenantIssuePrediction"
    ADD CONSTRAINT "TenantIssuePrediction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenantRating TenantRating_leaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TenantRating"
    ADD CONSTRAINT "TenantRating_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES public."Lease"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenantRating TenantRating_raterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TenantRating"
    ADD CONSTRAINT "TenantRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenantRating TenantRating_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TenantRating"
    ADD CONSTRAINT "TenantRating_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_leaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES public."Lease"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXReviewAssignment UXReviewAssignment_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXReviewAssignment"
    ADD CONSTRAINT "UXReviewAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXReviewAssignment UXReviewAssignment_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXReviewAssignment"
    ADD CONSTRAINT "UXReviewAssignment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public."UXReview"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXReviewComment UXReviewComment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXReviewComment"
    ADD CONSTRAINT "UXReviewComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXReviewComment UXReviewComment_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXReviewComment"
    ADD CONSTRAINT "UXReviewComment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public."UXReview"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXReview UXReview_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXReview"
    ADD CONSTRAINT "UXReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXSurveyAnswer UXSurveyAnswer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurveyAnswer"
    ADD CONSTRAINT "UXSurveyAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."UXSurveyQuestion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXSurveyAnswer UXSurveyAnswer_responseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurveyAnswer"
    ADD CONSTRAINT "UXSurveyAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES public."UXSurveyResponse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXSurveyQuestion UXSurveyQuestion_surveyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurveyQuestion"
    ADD CONSTRAINT "UXSurveyQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES public."UXSurvey"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXSurveyResponse UXSurveyResponse_respondentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurveyResponse"
    ADD CONSTRAINT "UXSurveyResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXSurveyResponse UXSurveyResponse_surveyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurveyResponse"
    ADD CONSTRAINT "UXSurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES public."UXSurvey"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UXSurvey UXSurvey_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UXSurvey"
    ADD CONSTRAINT "UXSurvey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VendorPayment VendorPayment_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendorPayment"
    ADD CONSTRAINT "VendorPayment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VendorPayment VendorPayment_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendorPayment"
    ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VendorPayment VendorPayment_workOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendorPayment"
    ADD CONSTRAINT "VendorPayment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES public."WorkOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VendorPerformanceRating VendorPerformanceRating_ratedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendorPerformanceRating"
    ADD CONSTRAINT "VendorPerformanceRating_ratedById_fkey" FOREIGN KEY ("ratedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VendorPerformanceRating VendorPerformanceRating_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendorPerformanceRating"
    ADD CONSTRAINT "VendorPerformanceRating_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VendorPerformanceRating VendorPerformanceRating_workOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendorPerformanceRating"
    ADD CONSTRAINT "VendorPerformanceRating_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES public."WorkOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Vendor Vendor_contactPersonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vendor"
    ADD CONSTRAINT "Vendor_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WhiteLabelConfig WhiteLabelConfig_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WhiteLabelConfig"
    ADD CONSTRAINT "WhiteLabelConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrderAssignment WorkOrderAssignment_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkOrderAssignment"
    ADD CONSTRAINT "WorkOrderAssignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrderAssignment WorkOrderAssignment_workOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkOrderAssignment"
    ADD CONSTRAINT "WorkOrderAssignment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES public."WorkOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrderQuote WorkOrderQuote_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkOrderQuote"
    ADD CONSTRAINT "WorkOrderQuote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrderQuote WorkOrderQuote_workOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkOrderQuote"
    ADD CONSTRAINT "WorkOrderQuote_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES public."WorkOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkOrder WorkOrder_maintenanceRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WorkOrder"
    ADD CONSTRAINT "WorkOrder_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES public."MaintenanceRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _PermissionToRole _PermissionToRole_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_PermissionToRole"
    ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PermissionToRole _PermissionToRole_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_PermissionToRole"
    ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _RentalWhiteLabelConfigs _RentalWhiteLabelConfigs_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_RentalWhiteLabelConfigs"
    ADD CONSTRAINT "_RentalWhiteLabelConfigs_A_fkey" FOREIGN KEY ("A") REFERENCES public."Rental"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _RentalWhiteLabelConfigs _RentalWhiteLabelConfigs_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_RentalWhiteLabelConfigs"
    ADD CONSTRAINT "_RentalWhiteLabelConfigs_B_fkey" FOREIGN KEY ("B") REFERENCES public."WhiteLabelConfig"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _RoleToUser _RoleToUser_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_RoleToUser"
    ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _RoleToUser _RoleToUser_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_RoleToUser"
    ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


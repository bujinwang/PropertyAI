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


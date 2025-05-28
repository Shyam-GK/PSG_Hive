--
-- PostgreSQL database dump
--

-- Dumped from database version 17.1
-- Dumped by pg_dump version 17.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: gender_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender_type AS ENUM (
    'Male',
    'Female'
);


ALTER TYPE public.gender_type OWNER TO postgres;

--
-- Name: residency_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.residency_type AS ENUM (
    'Hosteller',
    'Dayscholar'
);


ALTER TYPE public.residency_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Admin" (
    adm_id character varying(10) NOT NULL,
    name character varying(50) NOT NULL,
    password text NOT NULL,
    email character varying(100) NOT NULL,
    otp character varying(6)
);


ALTER TABLE public."Admin" OWNER TO postgres;

--
-- Name: Allotment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Allotment" (
    reg_id character varying(10) NOT NULL,
    student_id character varying(10) NOT NULL,
    club_id character varying(10) NOT NULL,
    alloted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(20) DEFAULT 'Inactive'::character varying NOT NULL,
    type character varying(20) DEFAULT 'Primary'::character varying NOT NULL,
    allotment_id bigint NOT NULL,
    CONSTRAINT "Allotment_status_check" CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[]))),
    CONSTRAINT "Allotment_type_check" CHECK (((type)::text = ANY ((ARRAY['Primary'::character varying, 'Associate'::character varying])::text[])))
);


ALTER TABLE public."Allotment" OWNER TO postgres;

--
-- Name: Allotment_new_allotment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Allotment_new_allotment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Allotment_new_allotment_id_seq" OWNER TO postgres;

--
-- Name: Allotment_new_allotment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Allotment_new_allotment_id_seq" OWNED BY public."Allotment".allotment_id;


--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendance" (
    student_id character varying(10) NOT NULL,
    attendance character varying(20) DEFAULT 'Absent'::character varying NOT NULL,
    att_id bigint NOT NULL,
    event_id bigint,
    CONSTRAINT "Attendance_attendance_check" CHECK (((attendance)::text = ANY ((ARRAY['Present'::character varying, 'Absent'::character varying])::text[])))
);


ALTER TABLE public."Attendance" OWNER TO postgres;

--
-- Name: Attendance_new_att_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Attendance_new_att_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Attendance_new_att_id_seq" OWNER TO postgres;

--
-- Name: Attendance_new_att_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Attendance_new_att_id_seq" OWNED BY public."Attendance".att_id;


--
-- Name: Clubs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Clubs" (
    club_id character varying(10) NOT NULL,
    club_name character varying(150) NOT NULL,
    description text,
    max_vacancy integer NOT NULL,
    min_allotment integer NOT NULL,
    faculty_advisor character varying(10) NOT NULL,
    poc character varying(50),
    poc_phone bigint,
    curr_allotment integer DEFAULT 0 NOT NULL,
    CONSTRAINT "Clubs_max_vacancy_check" CHECK ((max_vacancy > 0)),
    CONSTRAINT "Clubs_min_allotment_check" CHECK ((min_allotment >= 0)),
    CONSTRAINT clubs_currallotment CHECK (((curr_allotment >= min_allotment) AND (curr_allotment <= max_vacancy)))
);


ALTER TABLE public."Clubs" OWNER TO postgres;

--
-- Name: Events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Events" (
    club character varying(10) NOT NULL,
    start_datetime timestamp without time zone NOT NULL,
    end_datetime timestamp without time zone NOT NULL,
    event_desc character varying(150),
    event_name character varying(150),
    event_id bigint NOT NULL,
    CONSTRAINT events_time CHECK ((end_datetime > start_datetime))
);


ALTER TABLE public."Events" OWNER TO postgres;

--
-- Name: Events_new_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Events_new_event_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Events_new_event_id_seq" OWNER TO postgres;

--
-- Name: Events_new_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Events_new_event_id_seq" OWNED BY public."Events".event_id;


--
-- Name: RegistrationStatus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RegistrationStatus" (
    id integer NOT NULL,
    is_open boolean DEFAULT false NOT NULL,
    passout_year integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."RegistrationStatus" OWNER TO postgres;

--
-- Name: RegistrationStatus_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RegistrationStatus_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RegistrationStatus_id_seq" OWNER TO postgres;

--
-- Name: RegistrationStatus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RegistrationStatus_id_seq" OWNED BY public."RegistrationStatus".id;


--
-- Name: Registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Registrations" (
    reg_id character varying(10) NOT NULL,
    student_id character varying(10) NOT NULL,
    club_id character varying(10) NOT NULL,
    reg_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deadline timestamp without time zone NOT NULL,
    pref_value integer NOT NULL,
    CONSTRAINT "Registrations_pref_value_check" CHECK (((pref_value >= 1) AND (pref_value <= 10)))
);


ALTER TABLE public."Registrations" OWNER TO postgres;

--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    user_id character varying(10) NOT NULL,
    name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password text NOT NULL,
    dept character varying NOT NULL,
    class character varying,
    otp character varying(6),
    role character varying(20) DEFAULT 'student'::character varying NOT NULL,
    year_of_joining integer,
    can_select_clubs boolean DEFAULT true,
    gender public.gender_type,
    residency_status public.residency_type,
    CONSTRAINT users_nullcheck CHECK ((((class IS NOT NULL) AND (dept IS NOT NULL)) OR ((class IS NULL) AND (dept IS NOT NULL))))
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: Allotment allotment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allotment" ALTER COLUMN allotment_id SET DEFAULT nextval('public."Allotment_new_allotment_id_seq"'::regclass);


--
-- Name: Attendance att_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance" ALTER COLUMN att_id SET DEFAULT nextval('public."Attendance_new_att_id_seq"'::regclass);


--
-- Name: Events event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Events" ALTER COLUMN event_id SET DEFAULT nextval('public."Events_new_event_id_seq"'::regclass);


--
-- Name: RegistrationStatus id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationStatus" ALTER COLUMN id SET DEFAULT nextval('public."RegistrationStatus_id_seq"'::regclass);


--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Admin" (adm_id, name, password, email, otp) FROM stdin;
adm001	Rekha Sinha	adminpass123	rekha.sinha@college.edu	\N
adm002	Anil Kumar	secureadmin456	anil.kumar@college.edu	\N
adm003	Priya Nair	priyapass789	priya.nair@college.edu	\N
adm004	Raghav Menon	menonadmin321	raghav.menon@college.edu	\N
adm005	Sneha Iyer	iyersecure000	sneha.iyer@college.edu	\N
adm007	Shyam GK	$2b$10$UTyzNaLx.S/9ThV1kDx3fev8izlMWb76n4TbdAiam6H4IsUm3R.aa	23pw30@gmail.com	\N
adm0001	admintest1	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	admintest1@gmail.com	\N
adm0002	admintest2	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	admintest2@gmail.com	\N
adm0003	admintest3	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	admintest3@gmail.com	\N
adm0004	admintest4	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	admintest4@gmail.com	\N
adm0005	admintest5	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	admintest5@gmail.com	\N
\.


--
-- Data for Name: Allotment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Allotment" (reg_id, student_id, club_id, alloted_at, status, type, allotment_id) FROM stdin;
e155774c-a	23ME01	CLB001	2025-05-15 01:53:47.549	Active	Primary	1
f302efad-a	23ME01	CLB002	2025-05-15 01:53:47.555	Active	Associate	2
0f495c04-c	23ME01	CLB003	2025-05-15 01:53:47.558	Active	Associate	3
50e78237-7	23PW01	CLB004	2025-05-16 13:05:47.558	Active	Primary	4
f4aabf1f-7	23PW01	CLB002	2025-05-16 13:05:47.57	Active	Associate	5
ef3b210e-4	23PW01	CLB003	2025-05-16 13:05:47.576	Active	Associate	6
277735ff-8	23PW02	CLB002	2025-05-16 13:06:51.035	Active	Associate	7
a21c0517-d	23PW02	CLB003	2025-05-16 13:06:51.043	Active	Associate	8
d78c9107-0	23PW03	CLB001	2025-05-16 13:08:19.703	Active	Primary	9
f9b14486-3	23PW03	CLB007	2025-05-16 13:08:19.71	Active	Associate	10
c76e7f2a-1	23TC01	CLB011	2025-05-16 16:25:33.714	Active	Primary	11
4dbccde0-f	23TC01	CLB003	2025-05-16 16:25:33.727	Active	Associate	12
2a8d1070-a	23TC01	CLB002	2025-05-16 16:25:33.736	Active	Associate	13
dd78352a-5	23TC02	CLB011	2025-05-16 16:59:37.739	Active	Primary	14
00995d4f-3	23TC02	CLB006	2025-05-16 16:59:37.746	Active	Associate	15
1c012412-1	23TC02	CLB002	2025-05-16 16:59:37.749	Active	Associate	16
196a22ff-4	23DS01	CLB009	2025-05-17 14:34:06.323	Active	Primary	17
3a0c70e2-3	23DS01	CLB010	2025-05-17 14:34:06.34	Active	Associate	18
18260dbe-1	23DS01	CLB005	2025-05-17 14:34:06.344	Active	Associate	19
dc1a1af4-5	23DS03	CLB012	2025-05-17 15:46:44.318	Active	Primary	20
6a739293-f	23DS03	CLB011	2025-05-17 15:46:44.329	Active	Associate	21
f1752e39-f	23DS03	CLB001	2025-05-17 15:46:44.335	Active	Associate	22
b8d5139fcc	23PW30	CLB002	2025-05-22 14:27:58.604332	Active	Primary	35
e370c89e25	23PW30	CLB012	2025-05-22 14:27:58.604332	Active	Associate	36
1cb7cb2953	23PW30	CLB010	2025-05-22 14:27:58.604332	Active	Associate	37
48e65da3ff	23pw300	CLB005	2025-05-22 22:13:40.064466	Active	Primary	38
af5781e20c	23pw300	CLB011	2025-05-22 22:13:40.064466	Active	Associate	39
cb43d6491e	23pw300	CLB009	2025-05-22 22:13:40.064466	Active	Associate	40
4b535897c0	stu0004	CLB045	2025-05-23 01:24:31.794277	Active	Primary	44
d1fdb1ef47	stu0004	CLB047	2025-05-23 01:24:31.794277	Active	Associate	45
cddc74b2b9	stu0004	CLB046	2025-05-23 01:24:31.794277	Active	Associate	46
bb4bdf1a52	stu0003	CLB001	2025-05-26 09:40:31.31234	Active	Primary	47
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendance" (student_id, attendance, att_id, event_id) FROM stdin;
23TC02	Present	1	26
23PW02	Present	2	27
23ME01	Present	3	27
23PW01	Present	4	27
23TC01	Absent	5	27
23TC02	Absent	6	27
23PW01	Present	7	28
23PW02	Present	8	28
23ME01	Absent	9	28
23TC02	Present	10	28
23TC01	Absent	11	28
23DS01	Present	12	9
23pw300	Absent	13	9
23pw300	Present	14	21
23DS01	Absent	15	21
23PW03	Absent	17	1
23ME01	Present	18	1
23DS03	Present	16	1
\.


--
-- Data for Name: Clubs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Clubs" (club_id, club_name, description, max_vacancy, min_allotment, faculty_advisor, poc, poc_phone, curr_allotment) FROM stdin;
CLB001	American Society of Mechanical Engineers (Student Section)	Fosters innovation in mechanical engineering through workshops and projects.\\nEncourages student collaboration and industry exposure.	500	200	fac0001	\N	\N	350
CLB005	Indian Concrete Institute (Students Chapter)	Explores advancements in concrete technology through seminars and site visits.\\nEnhances civil engineering skills.	700	100	C5646	Vikram Singh	9876543210	500
CLB006	Indian Institution of Industrial Engineering (Students Chapter)	Focuses on industrial engineering principles through projects and workshops.\\nPrepares students for operational excellence.	200	100	C5153	Anjali Rao	8761234567	150
CLB007	Institute of Electrical & Electronics Engg.(IEEE) (Students Chapter)	Promotes electrical engineering innovation through technical events.\\nFacilitates industry-academia collaboration.	800	300	C535	Karthik Reddy	9123456780	600
CLB008	International Society of Automation (ISA) (Student Section)	Advances automation technologies through workshops and competitions.\\nConnects students with industry experts.	300	200	C6201	Meera Gupta	7896541230	250
CLB002	ASM Materials Advantage (Students Chapter)	Promotes materials science education through seminars and hands-on activities.\\nConnects students with industry professionals.	300	100	C6365	Priya Menon	8765432109	150
CLB003	Graduate Students Association	Supports graduate students with research and networking opportunities.\\nOrganizes academic events and workshops.	600	300	C6535	Rahul Nair	7891234567	450
CLB004	IEEE EMBS Student Branch	Advances biomedical engineering through technical workshops and projects.\\nPromotes innovation in healthcare technology.	400	200	C5114	Sneha Patel	9012345678	300
CLB009	ISHRAE (Students Chapter)	Promotes HVAC and refrigeration knowledge through technical sessions.\\nEncourages sustainable engineering practices.	400	100	C5771	Arjun Desai	9019876543	300
CLB010	ISTE (Students Chapter)	Enhances technical education through workshops and seminars.\\nFosters professional development for students.	600	200	C3581	Divya Joshi	8765432190	400
CLB011	Ramanujan Association of Mathematics	Promotes mathematical exploration through competitions and seminars.\\nEncourages problem-solving and research.	500	300	C3144	Suresh Kumar	9871234567	450
CLB012	Sir C.V.Raman Physics Association	Explores physics concepts through experiments and discussions.\\nPromotes scientific inquiry and innovation.	300	100	C585	Neha Sharma	9123456709	200
CLB013	Aeronautical Association	Focuses on aeronautical engineering through projects and workshops.\\nEncourages aviation-related innovation.	400	200	C5771	Ravi Patel	7891234509	350
CLB014	Society of Automotive Engineers (SAE) (Collegiate Chapter)	Promotes automotive engineering through vehicle design and competitions.\\nFosters industry connections.	700	300	C1528	Anita Menon	9012345609	500
CLB015	Society of Manufacturing Engineers	Advances manufacturing technologies through workshops and projects.\\nPrepares students for industry challenges.	500	100	C6054	Vijay Kumar	9876543201	300
CLB016	Solar Energy Society of India (Students Chapter)	Promotes solar energy research and sustainable practices.\\nOrganizes workshops on renewable energy.	600	200	C5588	Pooja Nair	8765432101	400
CLB017	The Indian Institute of Metals (Students Affiliate Chapter)	Explores metallurgy through seminars and industry visits.\\nFosters material science innovation.	300	100	C6045	Rohan Gupta	9123456701	200
CLB018	Institute of Engineers(India) Student Chapter	Promotes engineering excellence through technical events.\\nConnects students with professional engineers.	800	300	C570	Shalini Rao	7891234560	600
CLB019	The Institution of Electronics & Telecommunication Engineers (Stu.Chap)	Advances electronics and telecom through workshops and projects.\\nFosters technical innovation.	400	200	C5062	Kiran Desai	9012345670	300
CLB020	Tech Music	Explores music technology through performances and workshops.\\nFosters creativity in audio engineering.	200	100	C5334	Aditya Sharma	9876543212	150
CLB021	Tamil Mandram	Promotes Tamil language and culture through events and competitions.\\nEncourages literary and cultural engagement.	600	300	C3688	Lakshmi Nair	8765432102	450
CLB022	Dramatics Club	Fosters theatrical skills through plays and workshops.\\nEncourages creative expression and teamwork.	400	200	C561	Siddharth Patel	9123456702	300
CLB023	Fine Arts Club	Promotes visual arts through exhibitions and workshops.\\nEncourages creative and artistic expression.	500	100	C3323	Ananya Gupta	7891234561	350
CLB024	CAP & Nature Club	Promotes environmental awareness through conservation activities.\\nOrganizes nature camps and green initiatives.	700	300	C6592	Vivek Kumar	9012345671	500
CLB025	English Literary Society	Enhances literary skills through debates and writing workshops.\\nPromotes appreciation for English literature.	300	100	C465	Priyanka Sharma	9876543213	200
CLB026	Youth Red Cross Society	Promotes humanitarian values through community service.\\nOrganizes health and disaster relief initiatives.	600	200	C554	Arvind Menon	8765432103	400
CLB027	Martial Arts Club	Teaches self-defense and discipline through martial arts training.\\nPromotes physical fitness and mental strength.	400	100	C574	Snehal Desai	9123456703	300
CLB028	Rotaract Club	Fosters leadership and community service through projects.\\nConnects students with global Rotaract network.	500	200	C3329	Rakesh Kumar	7891234562	350
CLB029	Entrepreneurs Club	Encourages entrepreneurial skills through workshops and startup events.\\nFosters innovation and business acumen.	800	300	C5690	Meena Nair	9012345672	600
CLB030	Astronomy Club	Explores celestial phenomena through stargazing and lectures.\\nPromotes interest in astrophysics.	300	100	C3030	Vikrant Sharma	9876543214	200
CLB031	Pathshala Club	Promotes education outreach through teaching and workshops.\\nFosters community learning initiatives.	400	200	C6036	Anita Rao	8765432104	300
CLB032	Global Leaders Forum	Develops leadership skills through global issue discussions.\\nOrganizes international collaboration events.	600	300	C6159	Karthik Patel	9123456704	450
CLB033	International Education Cell	Facilitates global education opportunities and exchange programs.\\nPromotes cross-cultural learning.	500	100	C5569	Shalini Gupta	7891234563	350
CLB035	Women in Development Cell	Empowers women through skill-building and awareness programs.\\nPromotes gender equality initiatives.	300	100	C6397	Priya Desai	9876543215	200
CLB036	Association of Serious Quizzers	Fosters quizzing culture through competitions and knowledge-sharing.\\nEncourages intellectual engagement.	400	200	C6496	Aditya Menon	8765432105	300
CLB037	Student Research Council	Promotes student research through projects and publications.\\nFosters innovation and inquiry.	600	300	C5636	Sneha Kumar	9123456705	450
CLB038	Industry (Alumni) Interaction Forum	Connects students with alumni for industry insights and mentorship.\\nOrganizes networking events.	500	100	C1341	Vikram Rao	7891234564	350
CLB039	Radio Hub	Promotes radio broadcasting skills through workshops and shows.\\nFosters creative communication.	300	200	C6006	Anjali Sharma	9012345674	250
CLB040	Book Readers Club	Encourages reading through book discussions and literary events.\\nFosters a love for literature.	400	100	C3339	Rohan Nair	9876543216	300
CLB041	PSG Tech Chronicle Club	Documents campus events through journalism and media.\\nPromotes storytelling and reporting.	600	300	C583	Meera Patel	8765432106	450
CLB042	Youth Outreach Club	Engages youth in community service and social initiatives.\\nPromotes social responsibility.	500	200	C3026	Karthik Gupta	9123456706	350
CLB043	Artificial Intelligence & Robotics Club	Explores AI and robotics through projects and competitions.\\nFosters technological innovation.	700	100	C6313	Shalini Menon	7891234565	500
CLB044	Aeromodelling Club	Promotes aeromodelling through design and flying competitions.\\nEncourages aviation enthusiasm.	300	200	C5671	Vivek Desai	9012345675	250
CLB045	Finverse Club	Explores finance and investment through workshops and simulations.\\nFosters financial literacy.	400	100	C6289	Anita Kumar	9876543217	300
CLB046	SPIC-MACAY Heritage Club	Promotes Indian heritage through cultural events and performances.\\nFosters appreciation for traditional arts.	600	300	C5225	Ravi Sharma	8765432107	450
CLB047	Anti Drug Club	Raises awareness about drug prevention through campaigns.\\nPromotes healthy lifestyle choices.	500	200	C5928	Priya Nair	9123456707	350
CLB048	Yuva Tourism Club	Promotes tourism and cultural exploration through trips and events.\\nFosters appreciation for heritage.	300	100	C6355	Aditya Patel	7891234566	200
CLB049	Cyber Security Club	Explores cybersecurity through workshops and ethical hacking challenges.\\nPromotes digital safety awareness.	400	200	C574	Sneha Gupta	9012345676	300
CLB034	Animal Welfare Club	Promotes animal welfare through awareness and rescue initiatives.\\nOrganizes pet adoption drives.	700	200	C5326	\N	\N	500
\.


--
-- Data for Name: Events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Events" (club, start_datetime, end_datetime, event_desc, event_name, event_id) FROM stdin;
CLB001	2025-06-01 10:00:00	2025-06-01 12:00:00	A hands-on introduction to AI and ML models.	AI Bootcamp	1
CLB002	2025-06-02 14:00:00	2025-06-02 16:30:00	Build projects in under 3 hours!	Hackathon Sprint	2
CLB003	2025-06-03 09:00:00	2025-06-03 11:00:00	\N	Robo Race	3
CLB004	2025-06-04 13:00:00	2025-06-04 15:00:00	UI/UX competition for creative minds.	Designathon	4
CLB005	2025-06-05 10:30:00	2025-06-05 12:30:00	A high-stakes debate competition.	SpeakUp Debate	5
CLB006	2025-06-06 15:00:00	2025-06-06 17:00:00	\N	Marketing Mavericks	6
CLB007	2025-06-07 11:00:00	2025-06-07 13:00:00	Open chess tournament for all levels.	Chess Masters	7
CLB008	2025-06-08 16:00:00	2025-06-08 18:00:00	Sustainability ideas pitch event.	Greenathon	8
CLB009	2025-06-09 10:00:00	2025-06-09 12:00:00	\N	Cultural Fiesta	9
CLB010	2025-06-10 14:00:00	2025-06-10 16:00:00	Launch a startup idea in a weekend.	Startup Weekend	10
CLB011	2025-06-11 13:00:00	2025-06-11 15:00:00	Intro to blockchain and cryptocurrency.	CryptoCon	11
CLB012	2025-06-12 09:00:00	2025-06-12 11:00:00	General knowledge and tech quiz.	Quizathon	12
CLB001	2025-06-13 10:00:00	2025-06-13 12:00:00	\N	ML Deep Dive	13
CLB002	2025-06-14 14:00:00	2025-06-14 16:00:00	HTML/CSS design showcase event.	Frontend Fiesta	14
CLB003	2025-06-15 10:30:00	2025-06-15 12:30:00	Robotics teams face off in a bot arena.	BattleBots	15
CLB004	2025-06-16 13:00:00	2025-06-16 15:30:00	\N	UI/UX Lab	16
CLB005	2025-06-17 15:00:00	2025-06-17 17:00:00	Experience how real-world legislation works.	Mock Parliament	17
CLB006	2025-06-18 11:00:00	2025-06-18 13:00:00	Create and pitch innovative brand campaigns.	Brandstorm	18
CLB007	2025-06-19 16:00:00	2025-06-19 18:00:00	\N	Rapid Blitz Chess	19
CLB008	2025-06-20 09:00:00	2025-06-20 11:00:00	Plant trees around the campus.	Tree Plantation Drive	20
CLB009	2025-06-21 10:00:00	2025-06-21 12:00:00	Student drama society performance.	Drama Night	21
CLB010	2025-06-22 14:00:00	2025-06-22 16:00:00	\N	Pitch Battle	22
CLB011	2025-06-23 13:00:00	2025-06-23 15:00:00	Hands-on blockchain workshop.	Blockchain 101	23
CLB012	2025-06-24 10:00:00	2025-06-24 12:00:00	Compete in a fun trivia contest.	Trivia Clash	24
CLB001	2025-06-25 15:00:00	2025-06-25 17:00:00	Experiment with neural nets visually.	TensorFlow Playground	25
CLB006	2025-05-20 10:36:00	2025-05-21 10:37:00	blahhhha	blah blah	26
CLB002	2025-05-20 22:55:00	2025-05-30 21:55:00	fddafa	asdadf	27
CLB002	2025-05-22 14:08:00	2025-05-29 17:06:00	ttttttttt	ttttttt	28
\.


--
-- Data for Name: RegistrationStatus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RegistrationStatus" (id, is_open, passout_year, updated_at) FROM stdin;
1	f	\N	2025-05-19 17:54:34.037979
\.


--
-- Data for Name: Registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Registrations" (reg_id, student_id, club_id, reg_at, deadline, pref_value) FROM stdin;
e155774c-a	23ME01	CLB001	2025-05-15 01:53:47.543934	2025-05-22 01:53:47.543934	1
f302efad-a	23ME01	CLB002	2025-05-15 01:53:47.543934	2025-05-22 01:53:47.543934	2
0f495c04-c	23ME01	CLB003	2025-05-15 01:53:47.543934	2025-05-22 01:53:47.543934	3
50e78237-7	23PW01	CLB004	2025-05-16 13:05:47.536754	2025-05-23 13:05:47.536754	1
f4aabf1f-7	23PW01	CLB002	2025-05-16 13:05:47.536754	2025-05-23 13:05:47.536754	2
ef3b210e-4	23PW01	CLB003	2025-05-16 13:05:47.536754	2025-05-23 13:05:47.536754	3
277735ff-8	23PW02	CLB002	2025-05-16 13:06:51.028892	2025-05-23 13:06:51.028892	2
a21c0517-d	23PW02	CLB003	2025-05-16 13:06:51.028892	2025-05-23 13:06:51.028892	3
d78c9107-0	23PW03	CLB001	2025-05-16 13:08:19.696535	2025-05-23 13:08:19.696535	1
f9b14486-3	23PW03	CLB007	2025-05-16 13:08:19.696535	2025-05-23 13:08:19.696535	2
c76e7f2a-1	23TC01	CLB011	2025-05-16 16:25:33.702153	2025-05-23 16:25:33.702153	1
4dbccde0-f	23TC01	CLB003	2025-05-16 16:25:33.702153	2025-05-23 16:25:33.702153	2
2a8d1070-a	23TC01	CLB002	2025-05-16 16:25:33.702153	2025-05-23 16:25:33.702153	3
dd78352a-5	23TC02	CLB011	2025-05-16 16:59:37.717814	2025-05-23 16:59:37.717814	1
00995d4f-3	23TC02	CLB006	2025-05-16 16:59:37.717814	2025-05-23 16:59:37.717814	2
1c012412-1	23TC02	CLB002	2025-05-16 16:59:37.717814	2025-05-23 16:59:37.717814	3
196a22ff-4	23DS01	CLB009	2025-05-17 14:34:06.315549	2025-05-24 14:34:06.315549	1
3a0c70e2-3	23DS01	CLB010	2025-05-17 14:34:06.315549	2025-05-24 14:34:06.315549	2
18260dbe-1	23DS01	CLB005	2025-05-17 14:34:06.315549	2025-05-24 14:34:06.315549	3
dc1a1af4-5	23DS03	CLB012	2025-05-17 15:46:44.308129	2025-05-24 15:46:44.308129	1
6a739293-f	23DS03	CLB011	2025-05-17 15:46:44.308129	2025-05-24 15:46:44.308129	2
f1752e39-f	23DS03	CLB001	2025-05-17 15:46:44.308129	2025-05-24 15:46:44.308129	3
b8d5139fcc	23PW30	CLB002	2025-05-22 14:27:58.604332	2025-05-29 14:27:58.606	1
e370c89e25	23PW30	CLB012	2025-05-22 14:27:58.604332	2025-05-29 14:27:58.606	2
1cb7cb2953	23PW30	CLB010	2025-05-22 14:27:58.604332	2025-05-29 14:27:58.606	3
48e65da3ff	23pw300	CLB005	2025-05-22 22:13:40.064466	2025-05-29 22:13:40.07	1
af5781e20c	23pw300	CLB011	2025-05-22 22:13:40.064466	2025-05-29 22:13:40.07	2
cb43d6491e	23pw300	CLB009	2025-05-22 22:13:40.064466	2025-05-29 22:13:40.07	3
4b535897c0	stu0004	CLB045	2025-05-23 01:24:31.794277	2025-05-30 01:24:31.801	1
d1fdb1ef47	stu0004	CLB047	2025-05-23 01:24:31.794277	2025-05-30 01:24:31.801	2
cddc74b2b9	stu0004	CLB046	2025-05-23 01:24:31.794277	2025-05-30 01:24:31.801	3
bb4bdf1a52	stu0003	CLB001	2025-05-26 09:40:31.31234	2025-06-02 09:40:31.318	1
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (user_id, name, email, password, dept, class, otp, role, year_of_joining, can_select_clubs, gender, residency_status) FROM stdin;
fac0001	facultytest1	facultytest1@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	CSE	\N	\N	faculty	\N	f	\N	\N
23CS01	Jack Hill	jack.hill@example.com	hashedpw10	AMCS	CS	\N	student	2022	t	\N	\N
C566	Mr.K.Sadesh	ksh.mech@psgtech.ac.in	hashedpw1	mech	\N	\N	faculty	\N	t	\N	\N
C6365	Dr.Manu.S.Mohan	manu.metal@psgtech.ac.in	hashedpw2	metal	\N	\N	faculty	\N	t	\N	\N
C6535	Dr.A.Sankar	dras.mca@psgtech.ac.in	hashedpw3	mca	\N	\N	faculty	\N	t	\N	\N
C5114	Dr.B.Banu Rekha	bbr.bme@psgtech.ac.in	hashedpw4	bme	\N	\N	faculty	\N	t	\N	\N
C5646	Dr.S.Praveenkumar	spk.civil@psgtech.ac.in	hashedpw5	civil	\N	\N	faculty	\N	t	\N	\N
C5153	Dr.T.Karthik	tka.mech@psgtech.ac.in	hashedpw6	mech	\N	\N	faculty	\N	t	\N	\N
C535	Dr K V Anusuya	kva.ece@psgtech.ac.in	hashedpw7	ece	\N	\N	faculty	\N	t	\N	\N
C6201	Ms.A.Latha Mary	alm.ice@psgtech.ac.in	hashedpw8	ice	\N	\N	faculty	\N	t	\N	\N
C5771	Dr.P.Viswanathan	pvn.mech@psgtech.ac.in	hashedpw9	mech	\N	\N	faculty	\N	t	\N	\N
C3581	Dr.R.Prakash	rpr.mech@psgtech.ac.in	hashedpw10	mech	\N	\N	faculty	\N	t	\N	\N
C3144	Dr.M.Bagyalakshmi	mbl.maths@psgtech.ac.in	hashedpw11	maths	\N	\N	faculty	\N	t	\N	\N
C585	Dr.P.Kathirvel	pkv.phy@psgtech.ac.in	hashedpw12	phy	\N	\N	faculty	\N	t	\N	\N
C1528	Dr.V.M.Murugesan	vmm.auto@psgtech.ac.in	hashedpw13	auto	\N	\N	faculty	\N	t	\N	\N
C6054	Mr.R.Arun Prakash	rap.prod@psgtech.ac.in	hashedpw14	prod	\N	\N	faculty	\N	t	\N	\N
C5588	Dr.R.Arun Kumar	rak.mech@psgtech.ac.in	hashedpw15	mech	\N	\N	faculty	\N	t	\N	\N
C6045	Mr.K.Krishnakumar	kkk.metal@psgtech.ac.in	hashedpw16	metal	\N	\N	faculty	\N	t	\N	\N
C570	Dr.D.Martin Suresh Babu	msb.mech@psgtech.ac.in	hashedpw17	mech	\N	\N	faculty	\N	t	\N	\N
C5062	Dr.P.Saravanan	dps.ece@psgtech.ac.in	hashedpw18	ece	\N	\N	faculty	\N	t	\N	\N
fac0002	facultytest2	facultytest2@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	ECE	\N	\N	faculty	\N	f	\N	\N
fac0003	facultytest3	facultytest3@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	MECH	\N	\N	faculty	\N	f	\N	\N
fac0004	facultytest4	facultytest4@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	AMCS	\N	\N	faculty	\N	f	\N	\N
fac0005	facultytest5	facultytest5@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	CSE	\N	\N	faculty	\N	f	\N	\N
stu0003	studenttest3	studenttest3@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	MECH	MECH-B	\N	student	2024	t	\N	\N
C5334	Dr.A.S.Prasanth	asp.mech@psgtech.ac.in	hashedpw19	mech	\N	\N	faculty	\N	t	\N	\N
C3688	Dr.R.Venkateswari	rvi.ece@psgtech.ac.in	hashedpw20	ece	\N	\N	faculty	\N	t	\N	\N
C561	Dr.S.Udhayakumar	suk.mech@psgtech.ac.in	hashedpw21	mech	\N	\N	faculty	\N	t	\N	\N
C3323	Dr.R.Prathiba Devi	rpd.afd@psgtech.ac.in	hashedpw22	afd	\N	\N	faculty	\N	t	\N	\N
C6592	Dr.J.Hema	hema.bio@psgtech.ac.in	hashedpw23	bio	\N	\N	faculty	\N	t	\N	\N
C465	Dr.S.P.Suresh Kumar	sps.english@psgtech.ac.in	hashedpw24	english	\N	\N	faculty	\N	t	\N	\N
C554	Dr.J.R.Sharmila	jrs.chem@psgtech.ac.in	hashedpw25	chem	\N	\N	faculty	\N	t	\N	\N
C574	Dr.N.Ilayaraja	nir.mca@psgtech.ac.in	hashedpw26	mca	\N	\N	faculty	\N	t	\N	\N
C3329	Dr.S.Poomagal	spm.amcs@psgtech.ac.in	hashedpw27	amcs	\N	\N	faculty	\N	t	\N	\N
C5690	Dr.K.Suresh Kumar	hod.hum@psgtech.ac.in	hashedpw28	hum	\N	\N	faculty	\N	t	\N	\N
C3030	Dr.S.Prasanna	spa.phy@psgtech.ac.in	hashedpw29	phy	\N	\N	faculty	\N	t	\N	\N
C6036	Dr.B.Uma Maheswari	umb.phy@psgtech.ac.in	hashedpw30	phy	\N	\N	faculty	\N	t	\N	\N
C6159	Dr.K.P.Radhika	kpr.hum@psgtech.ac.in	hashedpw31	hum	\N	\N	faculty	\N	t	\N	\N
C5569	Dr.J.Kanchana	kan.mech@psgtech.ac.in	hashedpw32	mech	\N	\N	faculty	\N	t	\N	\N
C5326	Dr.N.Ganesh Kumar	gkn.mech@psgtech.ac.in	hashedpw33	mech	\N	\N	faculty	\N	t	\N	\N
C6397	Dr.B.Nirosha	nbs.chem@psgtech.ac.in	hashedpw34	chem	\N	\N	faculty	\N	t	\N	\N
C6496	Dr.Jayanta Mondal	jmd.metal@psgtech.ac.in	hashedpw35	metal	\N	\N	faculty	\N	t	\N	\N
C5636	Dr.M.Kalayarasan	mkn.mech@psgtech.ac.in	hashedpw36	mech	\N	\N	faculty	\N	t	\N	\N
C1341	Dr.P.Visalakshi	spv.ece@psgtech.ac.in	hashedpw37	ece	\N	\N	faculty	\N	t	\N	\N
C6006	Mr.N.Sarithakumar	nsk.ece@psgtech.ac.in	hashedpw38	ece	\N	\N	faculty	\N	t	\N	\N
C3339	Dr.Mariyam Adnan	mag.afd@psgtech.ac.in	hashedpw39	afd	\N	\N	faculty	\N	t	\N	\N
C583	Dr.S.Sankarakumar	ssk.english@psgtech.ac.in	hashedpw40	english	\N	\N	faculty	\N	t	\N	\N
C3026	Ms.M.Radhiga	mra.maths@psgtech.ac.in	hashedpw41	maths	\N	\N	faculty	\N	t	\N	\N
C6313	Dr.P.D.Rathika	pdr.rae@psgtech.ac.in	hashedpw42	rae	\N	\N	faculty	\N	t	\N	\N
C5671	Dr.S.Pratheesh Kumar	spk.prod@psgtech.ac.in	hashedpw43	prod	\N	\N	faculty	\N	t	\N	\N
C6289	Dr.R.Shankar	sr.hum@psgtech.ac.in	hashedpw44	hum	\N	\N	faculty	\N	t	\N	\N
C5225	Dr.M.R.Sri Krishnan	mrs.fashion@psgtech.ac.in	hashedpw45	fashion	\N	\N	faculty	\N	t	\N	\N
C5928	Mr.N.Muthuram	nmr.prod@psgtech.ac.in	hashedpw46	prod	\N	\N	faculty	\N	t	\N	\N
C6355	Dr.R.Rudresh	rrh.english@psgtech.ac.in	hashedpw47	english	\N	\N	faculty	\N	t	\N	\N
23PW02	Bob Smith	bob.smith@example.com	hashedpw2	AMCS	SS	\N	student	2028	t	\N	\N
23PW03	Carol Davis	carol.davis@example.com	hashedpw3	AMCS	SS	\N	student	2028	t	\N	\N
23DS01	David Lee	david.lee@example.com	hashedpw4	AMCS	DS	\N	student	2028	t	\N	\N
23DS02	Eva Brown	eva.brown@example.com	hashedpw5	AMCS	DS	\N	student	2028	t	\N	\N
23DS03	Frank White	frank.white@example.com	hashedpw6	AMCS	DS	\N	student	2028	t	\N	\N
23TC01	Grace Hall	grace.hall@example.com	hashedpw7	AMCS	TCS	\N	student	2028	t	\N	\N
23TC02	Henry Green	henry.green@example.com	hashedpw8	AMCS	TCS	\N	student	2028	t	\N	\N
23TC03	Irene King	irene.king@example.com	hashedpw9	AMCS	TCS	\N	student	2028	t	\N	\N
stu0001	studenttest1	studenttest1@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	CSE	CSE-A	\N	student	2025	t	Male	Hosteller
stu0004	studenttest4	studenttest4@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	AMCS	AMCS-B	\N	student	2021	f	\N	\N
stu0002	studenttest2	studenttest2@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	ECE	ECE-A	\N	student	2025	t	\N	\N
23EB02	Victor Nash	victor.nash@example.com	hashedpw22	ECE	ECEB	\N	student	2024	t	\N	\N
stu0005	studenttest5	studenttest5@gmail.com	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	CSE	CSE-B	\N	student	2025	t	\N	\N
23CB02	Quinn Phillips	quinn.phillips@example.com	hashedpw17	CSE	CSEB	\N	student	2027	t	\N	\N
23CS02	Karen Adams	karen.adams@example.com	hashedpw11	AMCS	CS	\N	student	2028	t	\N	\N
23CS03	Leo Carter	leo.carter@example.com	hashedpw12	AMCS	CS	\N	student	2028	t	\N	\N
23EA02	Tina Parker	tina.parker@example.com	hashedpw20	ECE	ECEA	\N	student	2026	t	\N	\N
23EB01	Uma Foster	uma.foster@example.com	hashedpw21	ECE	ECEB	\N	student	2027	t	\N	\N
23CA01	Mia Mitchell	mia.mitchell@example.com	hashedpw13	CSE	CSEA	\N	student	2028	t	\N	\N
23CA02	Nick Baker	nick.baker@example.com	hashedpw14	CSE	CSEA	\N	student	2028	t	\N	\N
23CA03	Olivia Perez	olivia.perez@example.com	hashedpw15	CSE	CSEA	\N	student	2028	t	\N	\N
23CB01	Paul Turner	paul.turner@example.com	hashedpw16	CSE	CSEB	\N	student	2028	t	\N	\N
23ME01	Wendy Lane	wendy.lane@example.com	hashedpw23	MECH	MEA	\N	student	2028	t	\N	\N
23ME02	Xander Cole	xander.cole@example.com	hashedpw24	MECH	MEA	\N	student	2028	t	\N	\N
23ME03	Yara Diaz	yara.diaz@example.com	hashedpw25	MECH	MEA	\N	student	2028	t	\N	\N
22PW04	Zane Blake	zane.blake@example.com	hashedpw26	AMCS	SS	\N	student	2028	t	\N	\N
22DS04	Amy Grant	amy.grant@example.com	hashedpw27	AMCS	DS	\N	student	2028	t	\N	\N
22TC04	Ben Fox	ben.fox@example.com	hashedpw28	AMCS	TCS	\N	student	2028	t	\N	\N
22CS04	Clara Moon	clara.moon@example.com	hashedpw29	AMCS	CS	\N	student	2028	t	\N	\N
23EA01	Sam Rogers	sam.rogers@example.com	hashedpw19	ECE	ECEA	\N	student	2025	t	\N	\N
23CB03	Rachel Campbell	rachel.campbell@example.com	hashedpw18	CSE	CSEB	\N	student	2025	t	\N	\N
23pw300	shhhhh	shyamgokulkrish@gmail.com	$2b$10$XNZwzolTPExblNv4O6zZvu83G81XBEZqLErVqmZ78dqERVGHcq23u	CSE	A	\N	student	2020	t	\N	\N
22CA04	Derek Ray	derek.ray@example.com	hashedpw30	CSE	CSEA	\N	student	2028	t	\N	\N
23PW01	Alice Johnson	alice.johnson@example.com	$2b$10$HkpT4zNQaTp63BaQF9IMqOCI0djkc9vkP0Lzgbc/kgKSooPx1G7iu	AMCS	SS	\N	student	2028	t	\N	\N
STU001	Arjun Sharma	arjun.sharma@example.com	$2b$10$5rpfK3HJpjFi4XEMjvWqfOtRDAdBzQtKMVnx1rkS89wtIZgkzrsr.	CS	A	\N	student	2028	t	\N	\N
STU002	Priya Menon	priya.menon@example.com	$2b$10$muOACGQiXBWAMYbf0EO1Re9HMvWLwBFdVGY9cKarv3EyjcMjiFLme	EE	B	\N	student	2028	t	\N	\N
STU003	Rahul Kapoor	rahul.kapoor@example.com	$2b$10$rzIJj9irbnzSnK0brpVQaejC8iDjSEGjul0sDuCnPuq0DE/LnOZqS	ME	C	\N	student	2028	t	\N	\N
STU004	Anjali Nair	anjali.nair@example.com	$2b$10$oi3znFqhu4s9xH2oAL2e9OWTSgHu4BHV86hnqxgx9KuUN6Ig74.1S	ECE	A	\N	student	2028	t	\N	\N
STU005	Vikram Singh	vikram.singh@example.com	$2b$10$5rioJEEPOMhQ8AZAjQ.6E.wR.tOmpIyyd7v5ibZM9RFHcoO.j4ALC	IT	B	\N	student	2028	t	\N	\N
23PW30	Shyam GK	23pw30@psgtech.ac.in	$2b$10$KCfHhs9NufEnKyNYMCD21OOftUgIXYBBCkfLN/CtWsUoVwwWZuPu2	AMCS	SS	\N	student	2028	f	\N	\N
\.


--
-- Name: Allotment_new_allotment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Allotment_new_allotment_id_seq"', 47, true);


--
-- Name: Attendance_new_att_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Attendance_new_att_id_seq"', 21, true);


--
-- Name: Events_new_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Events_new_event_id_seq"', 28, true);


--
-- Name: RegistrationStatus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RegistrationStatus_id_seq"', 1, false);


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (adm_id);


--
-- Name: Allotment Allotment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allotment"
    ADD CONSTRAINT "Allotment_pkey" PRIMARY KEY (allotment_id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (att_id);


--
-- Name: Clubs Clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Clubs"
    ADD CONSTRAINT "Clubs_pkey" PRIMARY KEY (club_id);


--
-- Name: Events Events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Events"
    ADD CONSTRAINT "Events_pkey" PRIMARY KEY (event_id);


--
-- Name: RegistrationStatus RegistrationStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationStatus"
    ADD CONSTRAINT "RegistrationStatus_pkey" PRIMARY KEY (id);


--
-- Name: Registrations Registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registrations"
    ADD CONSTRAINT "Registrations_pkey" PRIMARY KEY (reg_id);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (user_id);


--
-- Name: Attendance unique_event_student; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT unique_event_student UNIQUE (event_id, student_id);


--
-- Name: Allotment Allotment_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allotment"
    ADD CONSTRAINT "Allotment_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public."Clubs"(club_id);


--
-- Name: Allotment Allotment_reg_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allotment"
    ADD CONSTRAINT "Allotment_reg_id_fkey" FOREIGN KEY (reg_id) REFERENCES public."Registrations"(reg_id);


--
-- Name: Allotment Allotment_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allotment"
    ADD CONSTRAINT "Allotment_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."Users"(user_id);


--
-- Name: Attendance Attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public."Events"(event_id);


--
-- Name: Attendance Attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."Users"(user_id);


--
-- Name: Events Events_club_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Events"
    ADD CONSTRAINT "Events_club_fkey" FOREIGN KEY (club) REFERENCES public."Clubs"(club_id);


--
-- Name: Registrations Registrations_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registrations"
    ADD CONSTRAINT "Registrations_club_id_fkey" FOREIGN KEY (club_id) REFERENCES public."Clubs"(club_id);


--
-- Name: Registrations Registrations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Registrations"
    ADD CONSTRAINT "Registrations_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."Users"(user_id);


--
-- PostgreSQL database dump complete
--


/* ============================================================
   syllabus-data.js — Canonical AKTU B.Tech CSE Curriculum Data
   Authoritative Source: AKTU B.Tech CSE & Allied Branches Combined
   First-Year (2026–27 CSE Stream) and Second-Year (BCS-Series Semesters III–IV).

   RULES IMPLEMENTED:
   1. Only B.Tech CSE First Year (Sem 1 & 2) and Second Year (Sem 3 & 4).
   2. Every slash-separated alternative ('/') is split into separate subjects.
   3. Exact names, codes, credits, L-T-P, and short syllabus from PDF.
   4. Non-credit subjects marked with credits: 0 and isNonCredit: true.
   ============================================================ */

export const CANONICAL_CURRICULUM_INFO = {
  institution: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
  branch: 'Computer Science and Engineering (CSE)',
  supportedYears: ['First Year', 'Second Year'],
  supportedSemesters: [1, 2, 3, 4],
  year1Scheme: '2026–27 CSE STREAM',
  year2Scheme: 'BCS-SERIES CSE / ALLIED BRANCHES'
};

export const SYLLABUS = {

  // ══════════════════════════════════════════════════════════════
  // YEAR 1 • 2026–27 CSE STREAM — SEMESTER I
  // ══════════════════════════════════════════════════════════════
  1: [
    {
      name: 'Quantum Physics and Applications',
      code: 'AAS101E',
      credits: 3,
      ltp: '3-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Quantum concepts, modern physics and engineering applications.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Quantum Mechanics Basics',
          topics: [
            { id: 'T1', name: 'Wave-particle duality and de-Broglie hypothesis' },
            { id: 'T2', name: 'Born interpretation and wave function properties' },
            { id: 'T3', name: 'Time-dependent and time-independent Schrödinger equations' },
            { id: 'T4', name: 'Particle in a 1D infinite potential well' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Electromagnetic Theory & Maxwell Equations',
          topics: [
            { id: 'T1', name: 'Displacement current and Maxwell equations' },
            { id: 'T2', name: 'Poynting vector and energy transport' },
            { id: 'T3', name: 'Electromagnetic wave propagation in free space and dielectrics' },
            { id: 'T4', name: 'Skin depth and boundary conditions' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Wave Optics & Interference',
          topics: [
            { id: 'T1', name: 'Interference of light and thin-film interference' },
            { id: 'T2', name: 'Newton rings and applications' },
            { id: 'T3', name: 'Fraunhofer diffraction through single and double slits' },
            { id: 'T4', name: 'Diffraction grating and resolving power' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Lasers and Optical Fibers',
          topics: [
            { id: 'T1', name: 'Spontaneous and stimulated emission, Einstein coefficients' },
            { id: 'T2', name: 'Population inversion and Ruby/He-Ne lasers' },
            { id: 'T3', name: 'Optical fiber principle, acceptance angle and numerical aperture' },
            { id: 'T4', name: 'Fiber classification, attenuation and dispersion' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Superconductivity & Nanomaterials',
          topics: [
            { id: 'T1', name: 'Superconductivity characteristics and Meissner effect' },
            { id: 'T2', name: 'Type I and Type II superconductors' },
            { id: 'T3', name: 'Introduction to nanomaterials and quantum confinement' },
            { id: 'T4', name: 'Carbon nanotubes and engineering applications' }
          ]
        }
      ]
    },
    {
      name: 'Applied Chemistry for Smart Systems',
      code: 'AAS102D',
      credits: 3,
      ltp: '3-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Smart materials, applied chemistry and engineering applications.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Smart Materials & Polymers',
          topics: [
            { id: 'T1', name: 'Smart materials classification and stimulus-responsive systems' },
            { id: 'T2', name: 'Conducting polymers and organic semiconductors' },
            { id: 'T3', name: 'Shape memory materials and liquid crystals' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Spectroscopic Analysis Techniques',
          topics: [
            { id: 'T1', name: 'UV-Visible spectroscopy principles and Beer-Lambert law' },
            { id: 'T2', name: 'Infrared (IR) spectroscopy and functional group identification' },
            { id: 'T3', name: 'Application of spectroscopy to smart materials' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Electrochemistry & Energy Storage',
          topics: [
            { id: 'T1', name: 'Galvanic cells and Nernst equation' },
            { id: 'T2', name: 'Lithium-ion batteries and secondary cells' },
            { id: 'T3', name: 'Fuel cells and supercapacitors in smart systems' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Corrosion & Surface Protection',
          topics: [
            { id: 'T1', name: 'Electrochemical mechanism of corrosion' },
            { id: 'T2', name: 'Types of corrosion (galvanic, pitting, stress)' },
            { id: 'T3', name: 'Corrosion control and protective smart coatings' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Water Chemistry & Smart Sensors',
          topics: [
            { id: 'T1', name: 'Water hardness and EDTA titration method' },
            { id: 'T2', name: 'Water softening techniques and reverse osmosis' },
            { id: 'T3', name: 'Chemical sensors and biosensors overview' }
          ]
        }
      ]
    },
    {
      name: 'Calculus and Linear Algebra',
      code: 'AAS103D',
      credits: 4,
      ltp: '3-1-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Calculus, matrices, determinants, eigenvalues and linear algebra.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Differential Calculus',
          topics: [
            { id: 'T1', name: 'Rolle theorem and Mean Value Theorems' },
            { id: 'T2', name: 'Taylor and Maclaurin series expansions' },
            { id: 'T3', name: 'Indeterminate forms and L-Hopital rule' },
            { id: 'T4', name: 'Curvature and evolutes' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Multivariable Differential Calculus',
          topics: [
            { id: 'T1', name: 'Partial derivatives and Euler theorem on homogeneous functions' },
            { id: 'T2', name: 'Total derivative and Jacobians' },
            { id: 'T3', name: 'Taylor expansion of multivariable functions' },
            { id: 'T4', name: 'Maxima, minima and Lagrange multipliers' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Multiple Integrals & Beta-Gamma Functions',
          topics: [
            { id: 'T1', name: 'Double and triple integrals evaluation' },
            { id: 'T2', name: 'Change of order of integration' },
            { id: 'T3', name: 'Change of variables to polar and cylindrical coordinates' },
            { id: 'T4', name: 'Beta and Gamma functions and applications' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Matrices & Systems of Linear Equations',
          topics: [
            { id: 'T1', name: 'Elementary row and column operations' },
            { id: 'T2', name: 'Rank of a matrix and echelon form' },
            { id: 'T3', name: 'Consistency of linear systems Ax = b' },
            { id: 'T4', name: 'Gauss elimination and Gauss-Jordan methods' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Eigenvalues & Vector Spaces',
          topics: [
            { id: 'T1', name: 'Eigenvalues, eigenvectors and characteristic polynomial' },
            { id: 'T2', name: 'Cayley-Hamilton theorem and matrix inverse calculation' },
            { id: 'T3', name: 'Diagonalization of symmetric matrices' },
            { id: 'T4', name: 'Vector spaces, linear independence and basis' }
          ]
        }
      ]
    },
    {
      name: 'Fundamentals of Electrical Engineering',
      code: 'AEE101A',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Electrical circuits and AC/DC fundamentals.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — DC Circuit Analysis',
          topics: [
            { id: 'T1', name: 'Kirchhoff voltage and current laws (KVL & KCL)' },
            { id: 'T2', name: 'Mesh and nodal analysis with dependent/independent sources' },
            { id: 'T3', name: 'Thevenin and Norton theorems' },
            { id: 'T4', name: 'Superposition theorem and Maximum Power Transfer theorem' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — AC Circuit Fundamentals',
          topics: [
            { id: 'T1', name: 'Sinusoidal waveforms, RMS, average value and form factor' },
            { id: 'T2', name: 'Phasor representation of R, L, and C components' },
            { id: 'T3', name: 'Series and parallel RLC circuits and resonance' },
            { id: 'T4', name: 'Real, reactive, apparent power and power factor' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Transformers & Magnetic Circuits',
          topics: [
            { id: 'T1', name: 'Magnetic circuit fundamentals and B-H curve' },
            { id: 'T2', name: 'Single-phase transformer operation and EMF equation' },
            { id: 'T3', name: 'Equivalent circuit, phasor diagram and efficiency' },
            { id: 'T4', name: 'Open circuit and short circuit tests' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Electrical Machines',
          topics: [
            { id: 'T1', name: 'DC machines operating principle and torque equation' },
            { id: 'T2', name: 'Three-phase induction motor working and torque-slip curve' },
            { id: 'T3', name: 'Synchronous machine generation principle' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Electrical Installations & Safety',
          topics: [
            { id: 'T1', name: 'Switchgear components: fuses, MCB, MCCB, and ELCB' },
            { id: 'T2', name: 'Earthing methods and necessity for safety' },
            { id: 'T3', name: 'Battery types, energy metering and tariff basics' }
          ]
        }
      ]
    },
    {
      name: 'Fundamentals of Electronics Engineering',
      code: 'AEC101A',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Semiconductor devices, electronic components and basic circuits.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Semiconductor Diodes & Applications',
          topics: [
            { id: 'T1', name: 'PN junction diode physics and V-I characteristics' },
            { id: 'T2', name: 'Half-wave, full-wave center-tapped and bridge rectifiers' },
            { id: 'T3', name: 'Capacitor filters and ripple factor' },
            { id: 'T4', name: 'Zener diode breakdown and voltage regulation' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Bipolar Junction Transistors (BJT)',
          topics: [
            { id: 'T1', name: 'BJT construction, operation and CB, CE, CC configurations' },
            { id: 'T2', name: 'Input and output characteristics in CE mode' },
            { id: 'T3', name: 'DC load line, operating point Q, and stability' },
            { id: 'T4', name: 'Transistor as a switch and as an amplifier' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Field Effect Transistors (FET & MOSFET)',
          topics: [
            { id: 'T1', name: 'JFET construction, drain and transfer characteristics' },
            { id: 'T2', name: 'Depletion and enhancement MOSFETs' },
            { id: 'T3', name: 'Comparison of BJT and FET devices' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Operational Amplifiers (Op-Amps)',
          topics: [
            { id: 'T1', name: 'Ideal and practical Op-Amp characteristics and CMRR' },
            { id: 'T2', name: 'Inverting and non-inverting amplifier configurations' },
            { id: 'T3', name: 'Summing amplifier, difference amplifier, integrator and differentiator' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Electronic Instruments & Digital Basics',
          topics: [
            { id: 'T1', name: 'Digital multimeter and Cathode Ray Oscilloscope (CRO)' },
            { id: 'T2', name: 'Function generators and sensors in electronic systems' },
            { id: 'T3', name: 'Binary logic basics and logic gates' }
          ]
        }
      ]
    },
    {
      name: 'Programming Languages',
      code: 'ACS101',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Programming concepts, variables, operators, control flow, functions and problem-solving.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Problem Solving & Language Foundations',
          topics: [
            { id: 'T1', name: 'Algorithms, flowcharts and pseudocode' },
            { id: 'T2', name: 'Compilation, execution pipeline and runtime environment' },
            { id: 'T3', name: 'Tokens, keywords, identifiers and basic data types' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Operators & Expressions',
          topics: [
            { id: 'T1', name: 'Arithmetic, relational, logical and bitwise operators' },
            { id: 'T2', name: 'Operator precedence and associativity' },
            { id: 'T3', name: 'Type conversion and formatted I/O operations' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Control Structures & Flow',
          topics: [
            { id: 'T1', name: 'Conditional branching: if, if-else, nested if, switch-case' },
            { id: 'T2', name: 'Iterative loops: while, do-while, and for loops' },
            { id: 'T3', name: 'Loop control statements: break, continue, and return' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Functions & Modular Programming',
          topics: [
            { id: 'T1', name: 'Function declaration, definition, and invocation' },
            { id: 'T2', name: 'Call by value and call by reference parameters' },
            { id: 'T3', name: 'Recursion and storage classes (auto, static, extern, register)' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Arrays, Strings & Pointers',
          topics: [
            { id: 'T1', name: '1D and 2D array representation and matrix manipulations' },
            { id: 'T2', name: 'String handling and standard library string functions' },
            { id: 'T3', name: 'Pointer basics, pointer arithmetic and array access via pointers' }
          ]
        }
      ]
    },
    {
      name: 'Introduction to Indian Knowledge System',
      code: 'AAS104',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Overview of Indian knowledge traditions and their context.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Foundations of Indian Knowledge Traditions',
          topics: [
            { id: 'T1', name: 'Vedas, Upavedas and Vedangas taxonomy' },
            { id: 'T2', name: 'Six philosophical Darshanas overview' },
            { id: 'T3', name: 'Epistemology (Pramana system) in Indian thought' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Mathematics & Astronomy in Ancient India',
          topics: [
            { id: 'T1', name: 'Decimal system, zero and place-value notations' },
            { id: 'T2', name: 'Contributions of Aryabhata, Brahmagupta and Bhaskaracharya' },
            { id: 'T3', name: 'Astronomical models and calendrical systems' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Science, Metallurgy & Architecture Heritage',
          topics: [
            { id: 'T1', name: 'Ancient metallurgy: Delhi iron pillar and wootz steel' },
            { id: 'T2', name: 'Vastu Shastra and town planning in Harappan civilisations' },
            { id: 'T3', name: 'Ayurveda principles: Tridosha and holistic wellness' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Linguistics & Knowledge Representation',
          topics: [
            { id: 'T1', name: 'Panini Ashtadhyayi and computational linguistics' },
            { id: 'T2', name: 'Sanskrit grammar structure and semantic networks' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Ecological Ethics & Contemporary Relevance',
          topics: [
            { id: 'T1', name: 'Traditional water harvesting and conservation systems' },
            { id: 'T2', name: 'Relevance of Indian Knowledge Systems in modern technology' }
          ]
        }
      ]
    },
    {
      name: 'Professional Communication and Technical Writing',
      code: 'AAS105',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Professional communication, technical writing and presentation skills.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Fundamentals of Professional Communication',
          topics: [
            { id: 'T1', name: 'Communication cycle, sender, channel, and feedback' },
            { id: 'T2', name: '7 Cs of effective communication' },
            { id: 'T3', name: 'Overcoming interpersonal and organizational barriers' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Technical Writing & Documentation',
          topics: [
            { id: 'T1', name: 'Technical description of devices and processes' },
            { id: 'T2', name: 'Technical reports: structure, executive summary, findings' },
            { id: 'T3', name: 'Project proposals and technical specifications' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Business Correspondence',
          topics: [
            { id: 'T1', name: 'Professional emails, memoranda and official letters' },
            { id: 'T2', name: 'Resume and curriculum vitae preparation' },
            { id: 'T3', name: 'Cover letters and application documentation' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Vocabulary & Style in Technical Contexts',
          topics: [
            { id: 'T1', name: 'Clarity, conciseness, precision and active voice' },
            { id: 'T2', name: 'Common errors and ambiguous phrasing in engineering' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Group Discussions & Oral Presentations',
          topics: [
            { id: 'T1', name: 'Group discussion dynamics and evaluation criteria' },
            { id: 'T2', name: 'Slide preparation and multimedia presentation delivery' },
            { id: 'T3', name: 'Interview techniques and non-verbal cues' }
          ]
        }
      ]
    },
    {
      name: 'Introduction to AI and Prompt Engineering',
      code: 'AAI101',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'AI fundamentals, generative AI and prompt design.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Artificial Intelligence Foundations',
          topics: [
            { id: 'T1', name: 'Definition, history, and Turing test of AI' },
            { id: 'T2', name: 'Types of AI: Narrow, General, Super AI' },
            { id: 'T3', name: 'AI vs Machine Learning vs Deep Learning' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Problem Solving & Search Strategies',
          topics: [
            { id: 'T1', name: 'State space representation and problem formulation' },
            { id: 'T2', name: 'Uninformed search: Breadth-First and Depth-First search' },
            { id: 'T3', name: 'Heuristic search: A* algorithm overview' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Knowledge & Reasoning Basics',
          topics: [
            { id: 'T1', name: 'Propositional logic and inference rules' },
            { id: 'T2', name: 'First-order logic and semantic networks' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Generative AI & Large Language Models',
          topics: [
            { id: 'T1', name: 'Transformer architecture high-level intuition' },
            { id: 'T2', name: 'Pre-training, fine-tuning and inference in LLMs' },
            { id: 'T3', name: 'Multimodal generative models for text, code, and vision' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Prompt Engineering & Ethical AI',
          topics: [
            { id: 'T1', name: 'Zero-shot, few-shot, and role-based prompt templates' },
            { id: 'T2', name: 'Chain-of-thought (CoT) and structured prompting' },
            { id: 'T3', name: 'Hallucination mitigation, bias, safety, and copyright in AI' }
          ]
        }
      ]
    },
    {
      name: 'Fundamentals of Mechanical Engineering',
      code: 'AME101A',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Basic mechanical systems and engineering concepts.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Engineering Mechanics & Force Systems',
          topics: [
            { id: 'T1', name: 'Concurrent and non-concurrent force systems' },
            { id: 'T2', name: 'Equilibrium equations and free body diagrams' },
            { id: 'T3', name: 'Friction laws and applications' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Stress & Strain in Structures',
          topics: [
            { id: 'T1', name: 'Normal stress, shear stress, and strain' },
            { id: 'T2', name: 'Stress-strain diagrams for ductile and brittle materials' },
            { id: 'T3', name: 'Hooke law, Young modulus, and Poisson ratio' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Thermodynamics Foundations',
          topics: [
            { id: 'T1', name: 'Thermodynamic systems, boundary, state, and processes' },
            { id: 'T2', name: 'First Law of Thermodynamics for closed and open systems' },
            { id: 'T3', name: 'Second Law of Thermodynamics and heat engines' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — IC Engines & Refrigeration Cycles',
          topics: [
            { id: 'T1', name: 'Four-stroke and two-stroke SI and CI engines' },
            { id: 'T2', name: 'Otto and Diesel cycles comparison' },
            { id: 'T3', name: 'Vapour compression refrigeration system' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Engineering Materials & Manufacturing Basics',
          topics: [
            { id: 'T1', name: 'Ferrous and non-ferrous metals, alloys and polymers' },
            { id: 'T2', name: 'Overview of casting, welding, and machining processes' }
          ]
        }
      ]
    },
    {
      name: 'Applied Physics Lab',
      code: 'AAS151',
      credits: 1,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Introductory physics experiments and measurements.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Optics & Laser Experiments',
          topics: [
            { id: 'T1', name: 'Determination of wavelength of sodium light using Newton rings' },
            { id: 'T2', name: 'Wavelength measurement using diffraction grating with He-Ne laser' },
            { id: 'T3', name: 'Numerical aperture measurement of optical fibers' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Solid State & Electrical Measurements',
          topics: [
            { id: 'T1', name: 'Band gap determination of semiconductor diode' },
            { id: 'T2', name: 'Hall effect measurement in semiconductors' },
            { id: 'T3', name: 'B-H curve tracing for ferromagnetic materials' }
          ]
        }
      ]
    },
    {
      name: 'Applied Chemistry for Smart Systems Lab',
      code: 'AAS152D',
      credits: 1,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Chemistry and smart-material experiments.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Quantitative Analysis & Water Testing',
          topics: [
            { id: 'T1', name: 'Determination of total hardness of water using standard EDTA' },
            { id: 'T2', name: 'Alkalinity measurement of water samples' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Smart Material Characterization',
          topics: [
            { id: 'T1', name: 'Viscosity average molecular weight determination of polymers' },
            { id: 'T2', name: 'Synthesis and conductometric analysis of smart conducting polymers' }
          ]
        }
      ]
    },
    {
      name: 'Electrical Engineering Lab',
      code: 'AEE151A',
      credits: 1,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Electrical measurements and circuit experiments.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Circuit Theorems Verification',
          topics: [
            { id: 'T1', name: 'Verification of Kirchhoff Laws (KVL and KCL)' },
            { id: 'T2', name: 'Verification of Thevenin and Superposition theorems' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — AC & Transformer Measurements',
          topics: [
            { id: 'T1', name: 'Frequency response and resonance of series RLC circuits' },
            { id: 'T2', name: 'Open circuit and short circuit tests of a single-phase transformer' }
          ]
        }
      ]
    },
    {
      name: 'Electronics Engineering Lab',
      code: 'AEC151A',
      credits: 1,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Electronic components and basic circuit experiments.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Semiconductor Diodes & Rectification',
          topics: [
            { id: 'T1', name: 'V-I characteristics of PN junction diode and Zener diode' },
            { id: 'T2', name: 'Half-wave and full-wave bridge rectifier with capacitor filter' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Transistors & Op-Amp Circuits',
          topics: [
            { id: 'T1', name: 'Input and output characteristics of CE BJT' },
            { id: 'T2', name: 'Inverting and non-inverting Op-Amp circuit configurations' }
          ]
        }
      ]
    },
    {
      name: 'Computer-Aided Engineering Drawing Lab',
      code: 'ACE151E',
      credits: 2,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Engineering drawing and CAD-based drafting.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — CAD Tools & Orthographic Projections',
          topics: [
            { id: 'T1', name: 'CAD interface setup, layers, draw and modify commands' },
            { id: 'T2', name: 'Projection of points and lines in different quadrants' },
            { id: 'T3', name: 'Projection of regular planes and simple solids' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Isometric Views & 3D Modeling',
          topics: [
            { id: 'T1', name: 'Isometric projections from multi-view orthographic drawings' },
            { id: 'T2', name: '3D solid modeling of basic machine components' }
          ]
        }
      ]
    },
    {
      name: 'Innovation and Design Thinking Lab',
      code: 'AID151',
      credits: 2,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Problem framing, ideation, prototyping and design thinking.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Empathize & Problem Framing',
          topics: [
            { id: 'T1', name: 'User empathy interviews, observation and persona building' },
            { id: 'T2', name: 'Problem statement formulation (How Might We)' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Ideate, Prototype & Test',
          topics: [
            { id: 'T1', name: 'Divergent brainstorming and concept selection' },
            { id: 'T2', name: 'Rapid prototyping: paper, digital wireframes, physical mockups' },
            { id: 'T3', name: 'User testing, feedback capture and iteration' }
          ]
        }
      ]
    },
    {
      name: 'Language Lab',
      code: 'AAS153',
      credits: 0,
      isNonCredit: true,
      ltp: 'Practical',
      category: 'Non-Credit / Audit',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Language, speaking and communication practice.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Phonetics & Oral Fluency',
          topics: [
            { id: 'T1', name: 'Phonetic symbols, vowel and consonant sounds' },
            { id: 'T2', name: 'Word stress, sentence rhythm and intonation' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Practical Speaking & Listening Practice',
          topics: [
            { id: 'T1', name: 'Audio comprehension exercises and note taking' },
            { id: 'T2', name: 'Role plays, extempore speeches and mock situational dialogue' }
          ]
        }
      ]
    },
    {
      name: 'Environment and Sustainability',
      code: 'AAC101',
      credits: 0,
      isNonCredit: true,
      ltp: 'Theory',
      category: 'Non-Credit / Audit',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Ecology, environmental concerns and sustainability.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Ecosystems & Biodiversity',
          topics: [
            { id: 'T1', name: 'Ecosystem structure, food chains, webs and energy flow' },
            { id: 'T2', name: 'Biodiversity values, threats and in-situ / ex-situ conservation' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Pollution, Climate Change & Sustainable Goals',
          topics: [
            { id: 'T1', name: 'Air, water, soil and noise pollution control' },
            { id: 'T2', name: 'Global warming, climate change and carbon footprint' },
            { id: 'T3', name: 'UN Sustainable Development Goals (SDGs) and circular economy' }
          ]
        }
      ]
    },
    {
      name: 'General Proficiency',
      code: 'AGP151',
      credits: 0,
      isNonCredit: true,
      ltp: '—',
      category: 'Non-Credit / Audit',
      academicYear: 'First Year',
      semester: 1,
      shortSyllabus: 'Overall academic and co-curricular performance.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Academic, Conduct & Co-curricular Assessment',
          topics: [
            { id: 'T1', name: 'Class attendance, academic discipline and institutional values' },
            { id: 'T2', name: 'Participation in seminars, technical clubs and extracurricular events' }
          ]
        }
      ]
    }
  ],

  // ══════════════════════════════════════════════════════════════
  // YEAR 1 • 2026–27 CSE STREAM — SEMESTER II
  // ══════════════════════════════════════════════════════════════
  2: [
    {
      name: 'Quantum Physics and Applications',
      code: 'AAS201E',
      credits: 3,
      ltp: '3-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Physics topics and applications specified by the curriculum.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Quantum Phenomena & Wave Mechanics',
          topics: [
            { id: 'T1', name: 'Black body radiation and Planck quantum postulate' },
            { id: 'T2', name: 'Compton scattering and wave packet group velocity' },
            { id: 'T3', name: 'Heisenberg uncertainty principle and applications' },
            { id: 'T4', name: 'Schrödinger equation and barrier penetration / quantum tunneling' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Solid State Physics & Band Theory',
          topics: [
            { id: 'T1', name: 'Free electron theory of metals and Fermi energy' },
            { id: 'T2', name: 'Kronig-Penney model and formation of energy bands' },
            { id: 'T3', name: 'Conductors, semiconductors and insulators classification' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Electromagnetic Waves & Dielectric Media',
          topics: [
            { id: 'T1', name: 'Continuity equation and displacement current density' },
            { id: 'T2', name: 'Maxwell wave equations in conducting and non-conducting media' },
            { id: 'T3', name: 'Dielectric polarization and Clausius-Mossotti relation' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Laser Systems & Photonics',
          topics: [
            { id: 'T1', name: 'Coherence length and temporal/spatial coherence' },
            { id: 'T2', name: 'Semiconductor diode lasers and industrial applications' },
            { id: 'T3', name: 'Fiber optic communication link architecture' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Quantum Technologies & Nanostructures',
          topics: [
            { id: 'T1', name: 'Quantum dots, quantum wires, and quantum wells' },
            { id: 'T2', name: 'Josephson junction and SQUID devices' },
            { id: 'T3', name: 'Introduction to quantum computing qubits and superposition' }
          ]
        }
      ]
    },
    {
      name: 'Applied Chemistry for Smart Systems',
      code: 'AAS202D',
      credits: 3,
      ltp: '3-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Applied chemistry and smart-material topics specified by the curriculum.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Advanced Polymers & Smart Hydrogels',
          topics: [
            { id: 'T1', name: 'Polymerization mechanisms and engineering thermoplastics' },
            { id: 'T2', name: 'Stimuli-responsive smart hydrogels in drug delivery' },
            { id: 'T3', name: 'Biodegradable polymers and sustainable alternatives' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Molecular Spectroscopy & Structural Probes',
          topics: [
            { id: 'T1', name: 'Rotational and vibrational molecular transitions' },
            { id: 'T2', name: 'NMR spectroscopy principles and chemical shift' },
            { id: 'T3', name: 'Mass spectrometry basics for molecular identification' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Next-Generation Energy Storage',
          topics: [
            { id: 'T1', name: 'Solid-state batteries and lithium-sulfur systems' },
            { id: 'T2', name: 'Photovoltaic cells and perovskite solar cells' },
            { id: 'T3', name: 'Hydrogen production and storage technologies' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Surface Chemistry & Nanomaterials',
          topics: [
            { id: 'T1', name: 'Adsorption isotherms (Freundlich and Langmuir)' },
            { id: 'T2', name: 'Colloids and self-assembled monolayers' },
            { id: 'T3', name: 'Synthesis and applications of metal nanoparticles' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Green Chemistry & Environmental Sensors',
          topics: [
            { id: 'T1', name: '12 principles of green chemistry and atom economy' },
            { id: 'T2', name: 'Electrochemical sensors for heavy metal water pollutants' },
            { id: 'T3', name: 'Gas sensors for environmental air quality monitoring' }
          ]
        }
      ]
    },
    {
      name: 'Numerical Methods',
      code: 'AAS203D',
      credits: 4,
      ltp: '3-1-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Numerical solution of equations, interpolation, numerical differentiation and integration.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Solution of Non-Linear & Transcendental Equations',
          topics: [
            { id: 'T1', name: 'Errors and propagation in numerical computation' },
            { id: 'T2', name: 'Bisection method and Regula-Falsi (false position) method' },
            { id: 'T3', name: 'Newton-Raphson method and order of convergence' },
            { id: 'T4', name: 'Secant method and Muller method' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Interpolation & Curve Fitting',
          topics: [
            { id: 'T1', name: 'Finite difference operators: forward, backward, central differences' },
            { id: 'T2', name: 'Newton forward and backward interpolation formulas' },
            { id: 'T3', name: 'Lagrange interpolation and Newton divided difference formula' },
            { id: 'T4', name: 'Method of least squares for linear and non-linear curve fitting' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Numerical Differentiation & Integration',
          topics: [
            { id: 'T1', name: 'Numerical differentiation using forward, backward and central differences' },
            { id: 'T2', name: 'Trapezoidal rule and Simpson 1/3 and 3/8 rules' },
            { id: 'T3', name: 'Weddle rule and Romberg integration' },
            { id: 'T4', name: 'Gaussian quadrature two-point and three-point formulas' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Solution of Systems of Linear Equations',
          topics: [
            { id: 'T1', name: 'Direct methods: Gauss elimination and Gauss-Jordan method' },
            { id: 'T2', name: 'LU decomposition (Crout and Doolittle methods)' },
            { id: 'T3', name: 'Iterative methods: Jacobi and Gauss-Seidel iterations' },
            { id: 'T4', name: 'Eigenvalues approximation via Rayleigh power method' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Numerical Solution of Ordinary Differential Equations',
          topics: [
            { id: 'T1', name: 'Taylor series method and Picard method of successive approximations' },
            { id: 'T2', name: 'Euler and Modified Euler methods' },
            { id: 'T3', name: 'Runge-Kutta 2nd and 4th order methods (RK4)' },
            { id: 'T4', name: 'Milne and Adams-Bashforth predictor-corrector methods' }
          ]
        }
      ]
    },
    {
      name: 'Fundamentals of Electrical Engineering',
      code: 'AEE201A',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Electrical engineering principles, circuits and measurements.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Advanced DC Network Analysis',
          topics: [
            { id: 'T1', name: 'Source transformation and duality principles' },
            { id: 'T2', name: 'Star-delta and delta-star conversions' },
            { id: 'T3', name: 'Reciprocity and Millman theorems' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Three-Phase AC Systems',
          topics: [
            { id: 'T1', name: 'Three-phase balanced voltage generation' },
            { id: 'T2', name: 'Star and delta connected loads: line vs phase relationships' },
            { id: 'T3', name: 'Two-wattmeter method of three-phase power measurement' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Single-Phase Transformers in Systems',
          topics: [
            { id: 'T1', name: 'Core and copper losses, voltage regulation calculation' },
            { id: 'T2', name: 'All-day efficiency in distribution transformers' },
            { id: 'T3', name: 'Auto-transformers principle and copper saving' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Electric Motors & Drives',
          topics: [
            { id: 'T1', name: 'Speed control methods for DC shunt and series motors' },
            { id: 'T2', name: 'Starting methods for three-phase induction motors' },
            { id: 'T3', name: 'Single-phase induction motor starting mechanisms' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Electrical Protection & Metering',
          topics: [
            { id: 'T1', name: 'Digital energy meters and power quality fundamentals' },
            { id: 'T2', name: 'Electrical shock prevention, safety standards and earthing' }
          ]
        }
      ]
    },
    {
      name: 'Fundamentals of Electronics Engineering',
      code: 'AEC201A',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Electronics principles, components and circuits.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Special Diodes & Optoelectronic Devices',
          topics: [
            { id: 'T1', name: 'Varactor diode, tunnel diode, and Schottky diode' },
            { id: 'T2', name: 'Light Emitting Diodes (LED) and photodiode operation' },
            { id: 'T3', name: 'Optocouplers and solar photovoltaic cells' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Transistor Biasing & Small-Signal Amplifiers',
          topics: [
            { id: 'T1', name: 'Fixed bias, collector-to-base bias, and voltage divider bias' },
            { id: 'T2', name: 'h-parameter model of BJT in CE mode' },
            { id: 'T3', name: 'Frequency response of single-stage RC coupled amplifier' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — MOSFET Operation & Switching',
          topics: [
            { id: 'T1', name: 'Enhancement MOSFET threshold voltage and conduction' },
            { id: 'T2', name: 'CMOS inverter structure and low-power dissipation' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Active Filters & 555 Timers',
          topics: [
            { id: 'T1', name: 'Op-Amp based 1st and 2nd order active low-pass and high-pass filters' },
            { id: 'T2', name: 'IC 555 timer architecture and astable/monostable multivibrators' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Digital Electronics Fundamentals',
          topics: [
            { id: 'T1', name: 'Boolean algebra laws, De Morgan theorems, and SOP/POS forms' },
            { id: 'T2', name: 'Karnaugh Maps (K-maps) simplification up to 4 variables' },
            { id: 'T3', name: 'Half adder, full adder, and multiplexer basics' }
          ]
        }
      ]
    },
    {
      name: 'Essentials of Data Structures',
      code: 'ACS201',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Arrays, linked lists, stacks, queues, trees, searching and sorting.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Arrays & Memory Mapping',
          topics: [
            { id: 'T1', name: 'Abstract Data Types (ADT) and Big-O asymptotic notation' },
            { id: 'T2', name: '1D and 2D arrays: row-major and column-major addressing' },
            { id: 'T3', name: 'Sparse matrices: representation and transpose operations' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Stacks and Queues',
          topics: [
            { id: 'T1', name: 'Stack ADT: push, pop, peek operations and array implementation' },
            { id: 'T2', name: 'Stack applications: infix to postfix conversion and evaluation' },
            { id: 'T3', name: 'Queue ADT: enqueue, dequeue, circular queue and priority queue' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Linked Lists',
          topics: [
            { id: 'T1', name: 'Singly linked list: insertion, deletion, and traversal' },
            { id: 'T2', name: 'Doubly linked list and circular linked list' },
            { id: 'T3', name: 'Polynomial addition using linked lists' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Trees & Binary Search Trees',
          topics: [
            { id: 'T1', name: 'Binary trees: properties, representation, and memory layout' },
            { id: 'T2', name: 'Tree traversals: Pre-order, In-order, and Post-order' },
            { id: 'T3', name: 'Binary Search Tree (BST): search, insert, and delete operations' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Searching and Sorting Algorithms',
          topics: [
            { id: 'T1', name: 'Linear search and binary search algorithm analysis' },
            { id: 'T2', name: 'Bubble sort, selection sort, and insertion sort' },
            { id: 'T3', name: 'Merge sort and quick sort algorithms and complexity' }
          ]
        }
      ]
    },
    {
      name: 'Introduction to Indian Knowledge System',
      code: 'AAS204',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Indian knowledge traditions and applications.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Ancient Indian Sciences & Philosophy',
          topics: [
            { id: 'T1', name: 'Vaisheshika atomic theory (Kanada) and Nyaya logic' },
            { id: 'T2', name: 'Samkhya metaphysics and Patanjali yoga sutras' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Classical Mathematics and Geometry',
          topics: [
            { id: 'T1', name: 'Sulba Sutras geometry and altar constructions' },
            { id: 'T2', name: 'Kuttaka algorithm for indeterminate equations' },
            { id: 'T3', name: 'Kerala School infinite series expansions (Madhava)' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Health Systems & Sustainable Architecture',
          topics: [
            { id: 'T1', name: 'Charaka and Sushruta Samhita surgical principles' },
            { id: 'T2', name: 'Eco-architecture and passive cooling in traditional temples' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Governance & Economic Ethics',
          topics: [
            { id: 'T1', name: 'Kautilya Arthashastra on administration and economic security' },
            { id: 'T2', name: 'Dharmic governance and public ethics' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Modern Applications & Global Impact',
          topics: [
            { id: 'T1', name: 'Integration of traditional knowledge into contemporary STEM' },
            { id: 'T2', name: 'Intellectual property rights and preservation of traditional systems' }
          ]
        }
      ]
    },
    {
      name: 'Professional Communication and Technical Writing',
      code: 'AAS205',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Technical communication, writing and presentation.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Advanced Written Discourse',
          topics: [
            { id: 'T1', name: 'Precision, tone, and audience-centric writing' },
            { id: 'T2', name: 'Drafting executive summaries and technical abstracts' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Technical Manuals & User Guides',
          topics: [
            { id: 'T1', name: 'Software requirement specification (SRS) documentation basics' },
            { id: 'T2', name: 'Standard operating procedures (SOPs) and user instruction manuals' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Research Papers & Citations',
          topics: [
            { id: 'T1', name: 'Structuring research papers: IMRAD format' },
            { id: 'T2', name: 'Academic referencing, APA/IEEE citation standards and plagiarism avoiding' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Negotiation & Interpersonal Communication',
          topics: [
            { id: 'T1', name: 'Negotiation strategies and dispute resolution' },
            { id: 'T2', name: 'Cross-cultural workplace communication' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Professional Public Speaking',
          topics: [
            { id: 'T1', name: 'Voice modulation, pacing, and visual storytelling' },
            { id: 'T2', name: 'Technical defense and viva-voce presentation handling' }
          ]
        }
      ]
    },
    {
      name: 'Introduction to AI and Prompt Engineering',
      code: 'AAI201',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'AI concepts, generative AI and prompt engineering.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Machine Learning Foundations in AI',
          topics: [
            { id: 'T1', name: 'Supervised, unsupervised, and reinforcement learning paradigms' },
            { id: 'T2', name: 'Classification vs regression, training/test splits and overfitting' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Neural Networks & Deep Learning Basics',
          topics: [
            { id: 'T1', name: 'Artificial neuron model, activation functions, and perceptrons' },
            { id: 'T2', name: 'Multi-layer feedforward networks and backpropagation intuition' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Natural Language Processing & Embeddings',
          topics: [
            { id: 'T1', name: 'Tokenization, stop words, stemming and lemmatization' },
            { id: 'T2', name: 'Word embeddings (Word2Vec) and vector semantic similarity' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Advanced Generative AI Architectures',
          topics: [
            { id: 'T1', name: 'Self-attention mechanism and transformer encoder/decoder' },
            { id: 'T2', name: 'Retrieval Augmented Generation (RAG) architecture fundamentals' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Prompt Engineering in Practice',
          topics: [
            { id: 'T1', name: 'Context window management, system prompts and temperature settings' },
            { id: 'T2', name: 'Automated code generation and prompt safety validation' }
          ]
        }
      ]
    },
    {
      name: 'Fundamentals of Mechanical Engineering',
      code: 'AME201A',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Mechanical engineering fundamentals and systems.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Kinematics and Power Transmission',
          topics: [
            { id: 'T1', name: 'Kinematic links, pairs, and inversion of mechanisms' },
            { id: 'T2', name: 'Belt, rope, and gear drives: velocity ratios and slip' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Fluid Mechanics Basics',
          topics: [
            { id: 'T1', name: 'Fluid properties: density, viscosity, surface tension' },
            { id: 'T2', name: 'Pascal law, hydrostatic equation, and Bernoulli theorem' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Steam Boilers & Heat Transfer',
          topics: [
            { id: 'T1', name: 'Fire-tube and water-tube boilers classification' },
            { id: 'T2', name: 'Modes of heat transfer: conduction (Fourier law), convection, radiation' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Hydraulic Machines',
          topics: [
            { id: 'T1', name: 'Pelton turbine, Francis turbine, and centrifugal pump overview' },
            { id: 'T2', name: 'Hydraulic actuators in automated systems' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Modern Manufacturing & Additive Manufacturing',
          topics: [
            { id: 'T1', name: 'CNC machining systems and robotic arm basics' },
            { id: 'T2', name: '3D printing technologies and rapid prototyping' }
          ]
        }
      ]
    },
    {
      name: 'Applied Physics Lab',
      code: 'AAS251',
      credits: 1,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Applied physics practical experiments.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Wave Optics & Polarization Practicals',
          topics: [
            { id: 'T1', name: 'Specific rotation of cane sugar solution using polarimeter' },
            { id: 'T2', name: 'Dispersive power of a prism material using spectrometer' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Modern Physics Experiments',
          topics: [
            { id: 'T1', name: 'Planck constant determination using photocell' },
            { id: 'T2', name: 'Verification of Stefan law of radiation' }
          ]
        }
      ]
    },
    {
      name: 'Applied Chemistry for Smart Systems Lab',
      code: 'AAS252D',
      credits: 1,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Applied chemistry and materials practical experiments.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Instrumental Chemical Analysis',
          topics: [
            { id: 'T1', name: 'pH-metric titration of strong acid against strong base' },
            { id: 'T2', name: 'Spectrophotometric determination of iron concentration' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Electrochemical & Sensor Experiments',
          topics: [
            { id: 'T1', name: 'Measurement of cell potential and verification of Nernst equation' },
            { id: 'T2', name: 'Preparation and characterization of smart conductive thin films' }
          ]
        }
      ]
    },
    {
      name: 'Electrical Engineering Lab',
      code: 'AEE251A',
      credits: 1,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Electrical circuits and measurements practicals.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Power & Three-Phase Measurements',
          topics: [
            { id: 'T1', name: 'Measurement of three-phase power and power factor by two-wattmeter method' },
            { id: 'T2', name: 'Calibration of single-phase digital energy meter' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Electric Motors Practicals',
          topics: [
            { id: 'T1', name: 'Speed control of DC shunt motor using armature and field resistance' },
            { id: 'T2', name: 'Load test on three-phase squirrel cage induction motor' }
          ]
        }
      ]
    },
    {
      name: 'Electronics Engineering Lab',
      code: 'AEC251A',
      credits: 1,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Electronics practical work and circuit testing.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Transistor & Op-Amp Circuit Verification',
          topics: [
            { id: 'T1', name: 'Frequency response of CE BJT amplifier' },
            { id: 'T2', name: 'Operational amplifier as summing amplifier and comparator' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Digital Logic Circuits',
          topics: [
            { id: 'T1', name: 'Verification of truth tables of basic and universal logic gates' },
            { id: 'T2', name: 'Implementation of half adder and full adder circuits' }
          ]
        }
      ]
    },
    {
      name: 'Computer-Aided Engineering Drawing Lab',
      code: 'ACE251E',
      credits: 2,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'CAD and engineering graphics practical work.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Sectional Views & Development of Surfaces',
          topics: [
            { id: 'T1', name: 'Section of solids: prisms, pyramids, cylinders, cones' },
            { id: 'T2', name: 'Development of lateral surfaces of cut solids' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Assembly Modeling in CAD',
          topics: [
            { id: 'T1', name: 'Creating multi-part machine assemblies (e.g. plummer block, flange coupling)' },
            { id: 'T2', name: 'Generating bill of materials (BOM) and dimensioned production drawings' }
          ]
        }
      ]
    },
    {
      name: 'Innovation and Design Thinking Lab',
      code: 'AID251',
      credits: 2,
      ltp: 'Practical',
      category: 'Practical / Lab',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Design thinking and project-based prototyping.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — User Persona & Customer Journey Mapping',
          topics: [
            { id: 'T1', name: 'Customer journey maps, touchpoints and pain point identification' },
            { id: 'T2', name: 'Minimum Viable Product (MVP) scope formulation' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Prototype Demonstration & Pitching',
          topics: [
            { id: 'T1', name: 'Iterative prototype validation with target end-users' },
            { id: 'T2', name: 'Elevator pitch deck creation and business model canvas (BMC)' }
          ]
        }
      ]
    },
    {
      name: 'Language Lab',
      code: 'AAS253',
      credits: 0,
      isNonCredit: true,
      ltp: 'Practical',
      category: 'Non-Credit / Audit',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Language and communication practice.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Speech Delivery & Active Listening',
          topics: [
            { id: 'T1', name: 'Phonetic transcription and accent neutralization' },
            { id: 'T2', name: 'Interactive group discussions and peer critique' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Professional Presentation Practicum',
          topics: [
            { id: 'T1', name: 'Delivering technical presentations with slide decks' },
            { id: 'T2', name: 'Simulated job interview practice and feedback' }
          ]
        }
      ]
    },
    {
      name: 'Environment and Sustainability',
      code: 'AAC201',
      credits: 0,
      isNonCredit: true,
      ltp: 'Theory',
      category: 'Non-Credit / Audit',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Environment, ecology and sustainability.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Renewable Energy & Natural Resources',
          topics: [
            { id: 'T1', name: 'Solar, wind, geothermal and biomass energy systems' },
            { id: 'T2', name: 'Water conservation, rain water harvesting, and watershed management' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Environmental Policies & Circular Economy',
          topics: [
            { id: 'T1', name: 'Environmental Protection Act and National Green Tribunal (NGT)' },
            { id: 'T2', name: 'Waste management: e-waste, solid waste, and plastic management rules' }
          ]
        }
      ]
    },
    {
      name: 'General Proficiency',
      code: 'AGP251',
      credits: 0,
      isNonCredit: true,
      ltp: '—',
      category: 'Non-Credit / Audit',
      academicYear: 'First Year',
      semester: 2,
      shortSyllabus: 'Overall academic and co-curricular performance.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Co-Curricular & Ethics Evaluation',
          topics: [
            { id: 'T1', name: 'Punctuality, assignments submission, and peer collaboration' },
            { id: 'T2', name: 'Community contribution and sports/cultural activity participation' }
          ]
        }
      ]
    }
  ],

  // ══════════════════════════════════════════════════════════════
  // YEAR 2 • BCS-SERIES CSE / ALLIED BRANCHES — SEMESTER III
  // ══════════════════════════════════════════════════════════════
  3: [
    {
      name: 'Science-Based Open Elective',
      code: 'BOE3**',
      credits: 4,
      ltp: '3-1-0',
      category: 'Elective',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Elective or branch-appropriate science topics based on approved college scheme.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Foundational Scientific Principles',
          topics: [
            { id: 'T1', name: 'Physical principles and scientific problem framing' },
            { id: 'T2', name: 'Mathematical models for applied systems' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Materials & System Properties',
          topics: [
            { id: 'T1', name: 'Thermodynamic and electronic properties of materials' },
            { id: 'T2', name: 'Microscopic and macroscopic state parameters' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Wave Dynamics & Energy Flow',
          topics: [
            { id: 'T1', name: 'Wave propagation in dispersive and non-dispersive media' },
            { id: 'T2', name: 'Energy transfer mechanisms and conservation' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Analytical & Experimental Methods',
          topics: [
            { id: 'T1', name: 'Experimental error analysis and data fitting' },
            { id: 'T2', name: 'Modern instrumentation and measurement transducers' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Interdisciplinary Science Applications',
          topics: [
            { id: 'T1', name: 'Computational modeling in engineering sciences' },
            { id: 'T2', name: 'Emerging scientific paradigms in computing' }
          ]
        }
      ]
    },
    {
      name: 'Mathematics III, IV or V',
      code: 'BAS303',
      credits: 4,
      ltp: '3-1-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Branch-appropriate advanced mathematics: complex analysis, probability distributions and statistics.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Complex Variables & Analytic Functions',
          topics: [
            { id: 'T1', name: 'Limit, continuity and differentiability of complex functions' },
            { id: 'T2', name: 'Cauchy-Riemann equations in Cartesian and polar coordinates' },
            { id: 'T3', name: 'Harmonic functions and Milne-Thomson method' },
            { id: 'T4', name: 'Conformal mapping and Bilinear transformations' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Complex Integration',
          topics: [
            { id: 'T1', name: 'Line integral in complex plane and Cauchy integral theorem' },
            { id: 'T2', name: 'Cauchy integral formula for higher derivatives' },
            { id: 'T3', name: 'Taylor series and Laurent series expansions' },
            { id: 'T4', name: 'Singularities and poles classification' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Residue Calculus & Real Integrals',
          topics: [
            { id: 'T1', name: 'Calculation of residues at simple and multiple poles' },
            { id: 'T2', name: 'Cauchy residue theorem' },
            { id: 'T3', name: 'Evaluation of real definite integrals around unit circles and semi-circles' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Probability Distributions',
          topics: [
            { id: 'T1', name: 'Random variables: discrete and continuous probability density functions' },
            { id: 'T2', name: 'Binomial distribution and Poisson distribution' },
            { id: 'T3', name: 'Normal distribution and standard normal variate (Z-score)' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Statistical Inference & Hypothesis Testing',
          topics: [
            { id: 'T1', name: 'Sampling distributions, standard error, null and alternative hypotheses' },
            { id: 'T2', name: 'Testing of hypothesis for large samples (Z-test)' },
            { id: 'T3', name: 'Small sample tests: Student t-test and F-test' },
            { id: 'T4', name: 'Chi-Square test for goodness of fit and independence of attributes' }
          ]
        }
      ]
    },
    {
      name: 'Universal Human Values & Professional Ethics',
      code: 'BVE301',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Human values, ethics and professional responsibility.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Course Introduction & Basic Aspirations',
          topics: [
            { id: 'T1', name: 'Need, basic guidelines and process for value education' },
            { id: 'T2', name: 'Self-exploration: content, process and natural acceptance' },
            { id: 'T3', name: 'Continuous happiness and prosperity as basic human aspirations' },
            { id: 'T4', name: 'Right understanding, relationships and physical facilities priority' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Harmony in the Human Being',
          topics: [
            { id: 'T1', name: 'Human being as co-existence of Self (I) and Body' },
            { id: 'T2', name: 'Distinguishing needs of Self (Sukh) and Body (Suvidha)' },
            { id: 'T3', name: 'Activities in Self: desire, thought, expectation and imagination' },
            { id: 'T4', name: 'Harmony of I with Body: Sanyam and Svasthya' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Harmony in the Family & Society',
          topics: [
            { id: 'T1', name: 'Values in relationship: Trust (Vishwas) and Respect (Samman)' },
            { id: 'T2', name: 'Distinction between respect and differentiation' },
            { id: 'T3', name: 'Other foundational values: Affection, Care, Guidance, Reverence, Glory, Gratitude, Love' },
            { id: 'T4', name: 'Comprehensive human goals and undivided society (Akhand Samaj)' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Harmony in Nature & Existence',
          topics: [
            { id: 'T1', name: 'Understanding four orders in nature: Material, Plant, Animal, Human' },
            { id: 'T2', name: 'Interconnectedness, self-regulation and mutual fulfilment' },
            { id: 'T3', name: 'Co-existence (Sah-astitva) of all beings in existence' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Professional Ethics in Practice',
          topics: [
            { id: 'T1', name: 'Definitiveness of ethical human conduct' },
            { id: 'T2', name: 'Competence in professional ethics and holistic technology models' },
            { id: 'T3', name: 'Case studies of corrupt vs value-driven professional practices' }
          ]
        }
      ]
    },
    {
      name: 'Technical Communication',
      code: 'BAS301',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Communication and technical writing.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Fundamentals of Technical Communication',
          topics: [
            { id: 'T1', name: 'Technical vs general communication: nature and scope' },
            { id: 'T2', name: 'Communication flow in engineering organizations' },
            { id: 'T3', name: 'Barriers to technical communication and remedies' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Forms of Technical Writing',
          topics: [
            { id: 'T1', name: 'Technical reports: types, structure, layout and graphics' },
            { id: 'T2', name: 'Technical proposals: solicited and unsolicited proposals' },
            { id: 'T3', name: 'Writing research abstracts, summaries and articles' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Technical Presentations & Visual Rhetoric',
          topics: [
            { id: 'T1', name: 'Planning and structuring technical oral presentations' },
            { id: 'T2', name: 'Visual aids: design principles, charts, diagrams and slide decks' },
            { id: 'T3', name: 'Kinesics, paralinguistics and audience rapport' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Language Style & Editing in Engineering',
          topics: [
            { id: 'T1', name: 'Syntactic clarity, conciseness and passive voice usage' },
            { id: 'T2', name: 'Technical vocabulary, jargon management and readability indexes' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Group Discussions & Interviews',
          topics: [
            { id: 'T1', name: 'Group discussion: roles, leadership and consensus building' },
            { id: 'T2', name: 'Technical and HR interview preparation strategies' }
          ]
        }
      ]
    },
    {
      name: 'Data Structure',
      code: 'BCS301',
      credits: 4,
      ltp: '3-1-0',
      category: 'Core Theory',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Arrays, linked lists, stacks, queues, trees, graphs, searching, sorting and algorithm analysis.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Introduction, Arrays & Complexity',
          topics: [
            { id: 'T1', name: 'Data structure definitions, classifications, and ADTs' },
            { id: 'T2', name: 'Asymptotic analysis: Big-O, Big-Omega, Big-Theta notations' },
            { id: 'T3', name: '1D and multidimensional array representation and addressing' },
            { id: 'T4', name: 'Sparse matrices: 3-tuple representation and fast transpose' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Stacks and Queues',
          topics: [
            { id: 'T1', name: 'Stack ADT, array and linked implementations, overflow/underflow' },
            { id: 'T2', name: 'Infix, prefix, and postfix expressions conversion and evaluation' },
            { id: 'T3', name: 'Queue ADT, circular queue implementation and advantage' },
            { id: 'T4', name: 'Double-ended queue (Deque) and priority queue' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Linked Lists',
          topics: [
            { id: 'T1', name: 'Singly linked list: node structure, insertion, deletion, search' },
            { id: 'T2', name: 'Circular linked lists and doubly linked lists' },
            { id: 'T3', name: 'Header linked list and polynomial addition application' },
            { id: 'T4', name: 'Memory allocation and garbage collection concepts' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Trees & Binary Search Trees',
          topics: [
            { id: 'T1', name: 'Tree terminology, binary tree representation and properties' },
            { id: 'T2', name: 'Binary tree traversals: preorder, inorder, postorder, level-order' },
            { id: 'T3', name: 'Binary Search Trees (BST): insertion, deletion and search' },
            { id: 'T4', name: 'AVL trees: balance factor and rotations (LL, RR, LR, RL)' },
            { id: 'T5', name: 'B-Trees and B+ Trees introduction' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Graphs, Searching & Sorting',
          topics: [
            { id: 'T1', name: 'Graph representations: adjacency matrix and adjacency list' },
            { id: 'T2', name: 'Breadth-First Search (BFS) and Depth-First Search (DFS)' },
            { id: 'T3', name: 'Minimum spanning tree: Prim and Kruskal algorithms' },
            { id: 'T4', name: 'Sorting: Bubble, Insertion, Selection, Merge, Quick, and Heap sort' },
            { id: 'T5', name: 'Hashing techniques, hash functions and collision resolution strategies' }
          ]
        }
      ]
    },
    {
      name: 'Computer Organization and Architecture',
      code: 'BCS302',
      credits: 4,
      ltp: '3-1-0',
      category: 'Core Theory',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Number representation, arithmetic, CPU, instruction sets, memory and I/O organization.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Computer Arithmetic & Instruction Sets',
          topics: [
            { id: 'T1', name: 'Functional units of digital computer and Von Neumann architecture' },
            { id: 'T2', name: 'Fixed-point and IEEE 754 floating-point number representation' },
            { id: 'T3', name: 'Booth multiplication algorithm and restoring/non-restoring division' },
            { id: 'T4', name: 'Instruction formats (0, 1, 2, 3 address) and addressing modes' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Central Processing Unit & Control Design',
          topics: [
            { id: 'T1', name: 'Register organization, bus architecture and tri-state buffers' },
            { id: 'T2', name: 'Instruction cycle: fetch, decode, execute phases' },
            { id: 'T3', name: 'Hardwired control unit vs microprogrammed control unit' },
            { id: 'T4', name: 'Microinstruction sequencing, execution and address sequencing' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Pipelining & Parallelism',
          topics: [
            { id: 'T1', name: 'Linear pipelining, pipeline throughput, speedup and efficiency' },
            { id: 'T2', name: 'Instruction pipeline and pipeline hazards (structural, data, control)' },
            { id: 'T3', name: 'Superscalar architecture and Flynn classification' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Memory Hierarchy & Cache Design',
          topics: [
            { id: 'T1', name: 'Memory hierarchy: registers, cache, main memory, auxiliary storage' },
            { id: 'T2', name: 'Cache memory: mapping techniques (direct, associative, set-associative)' },
            { id: 'T3', name: 'Cache write policies (write-through, write-back) and replacement (LRU, FIFO)' },
            { id: 'T4', name: 'Virtual memory: paging, segmentation and page fault handling' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Input-Output Organization',
          topics: [
            { id: 'T1', name: 'Peripheral devices and I/O interface' },
            { id: 'T2', name: 'Programmed I/O and interrupt-driven I/O' },
            { id: 'T3', name: 'Direct Memory Access (DMA): controller architecture and transfer modes' },
            { id: 'T4', name: 'Standard bus interfaces (PCI, SCSI, USB)' }
          ]
        }
      ]
    },
    {
      name: 'Discrete Structures and Theory of Logic',
      code: 'BCS303',
      credits: 3,
      ltp: '2-1-0',
      category: 'Core Theory',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Logic, sets, relations, functions, combinatorics, Boolean algebra and graph theory.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Sets, Relations & Functions',
          topics: [
            { id: 'T1', name: 'Sets, operations, Venn diagrams and principle of inclusion-exclusion' },
            { id: 'T2', name: 'Relations: properties, equivalence relations, equivalence classes' },
            { id: 'T3', name: 'Partially Ordered Sets (Poset) and Hasse diagrams' },
            { id: 'T4', name: 'Functions: injective, surjective, bijective, and composite functions' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Algebraic Structures & Lattices',
          topics: [
            { id: 'T1', name: 'Semigroups, monoids, groups, abelian groups and subgroups' },
            { id: 'T2', name: 'Cosets, Lagrange theorem and cyclic groups' },
            { id: 'T3', name: 'Lattices as posets and as algebraic structures' },
            { id: 'T4', name: 'Distributive, bounded, complemented lattices and Boolean algebra' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Propositional Logic & Quantifiers',
          topics: [
            { id: 'T1', name: 'Propositions, logical connectives, truth tables and tautologies' },
            { id: 'T2', name: 'Logical equivalence, normal forms (CNF and DNF)' },
            { id: 'T3', name: 'Predicates, universal and existential quantifiers' },
            { id: 'T4', name: 'Inference rules, valid arguments and resolution proof method' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Combinatorics & Recurrence Relations',
          topics: [
            { id: 'T1', name: 'Permutations, combinations and Pigeonhole Principle' },
            { id: 'T2', name: 'Generating functions and formal power series' },
            { id: 'T3', name: 'Solving linear recurrence relations with constant coefficients' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Graph Theory & Trees',
          topics: [
            { id: 'T1', name: 'Graph types: simple, multigraph, directed, bipartite graphs' },
            { id: 'T2', name: 'Euler paths and circuits, Hamiltonian paths and cycles' },
            { id: 'T3', name: 'Planar graphs, Kuratowski theorem and graph coloring (chromatic number)' },
            { id: 'T4', name: 'Trees, properties of trees, spanning trees and cut-sets' }
          ]
        }
      ]
    },
    {
      name: 'Data Structure Lab',
      code: 'BCS351',
      credits: 1,
      ltp: '0-0-2',
      category: 'Practical / Lab',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Implementation of common data structures and algorithms.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Linear Structures Implementation',
          topics: [
            { id: 'T1', name: 'Array insertion, deletion, and sparse matrix addition in C' },
            { id: 'T2', name: 'Stack implementation and infix-to-postfix conversion program' },
            { id: 'T3', name: 'Linear queue and circular queue implementations' },
            { id: 'T4', name: 'Singly and doubly linked list complete operations' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Non-Linear Structures & Algorithm Implementations',
          topics: [
            { id: 'T1', name: 'Binary search tree creation, traversal and search algorithms' },
            { id: 'T2', name: 'Breadth-First and Depth-First graph traversal algorithms' },
            { id: 'T3', name: 'Implementation of Quick sort, Merge sort and Heap sort' }
          ]
        }
      ]
    },
    {
      name: 'Computer Organization and Architecture Lab',
      code: 'BCS352',
      credits: 1,
      ltp: '0-0-2',
      category: 'Practical / Lab',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Digital logic and computer architecture practical exercises.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Digital Logic & Arithmetic Circuits',
          topics: [
            { id: 'T1', name: 'Design and simulation of 4-bit parallel adder and subtractor' },
            { id: 'T2', name: 'Design of 4-bit Arithmetic Logic Unit (ALU)' },
            { id: 'T3', name: 'Simulation of Booth binary multiplication algorithm' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — CPU Simulation & Memory Mapping',
          topics: [
            { id: 'T1', name: 'Design of register files and bus multiplexing' },
            { id: 'T2', name: 'Cache memory hit/miss simulation under direct and set-associative mapping' }
          ]
        }
      ]
    },
    {
      name: 'Web Designing Workshop',
      code: 'BCS353',
      credits: 1,
      ltp: '0-0-2',
      category: 'Workshop',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'HTML, CSS, JavaScript and basic interactive websites.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Semantic HTML5 & Modern CSS Layouts',
          topics: [
            { id: 'T1', name: 'Semantic HTML5 structure: header, nav, section, article, footer' },
            { id: 'T2', name: 'CSS Flexbox and CSS Grid responsive page layout systems' },
            { id: 'T3', name: 'Media queries, responsive typography, and mobile-first design' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — JavaScript DOM & Client-Side Interactivity',
          topics: [
            { id: 'T1', name: 'JavaScript variables, functions, and event listeners' },
            { id: 'T2', name: 'DOM manipulation: querySelector, createElement, classList' },
            { id: 'T3', name: 'Form validation and persistent localStorage handling' }
          ]
        }
      ]
    },
    {
      name: 'Cyber Security',
      code: 'BCC301',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Security fundamentals and threats / cybersecurity principles.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Introduction to Cyber Security & Threats',
          topics: [
            { id: 'T1', name: 'Cyber security goals: Confidentiality, Integrity, Availability (CIA)' },
            { id: 'T2', name: 'Threat vectors: malware, viruses, worms, trojans, spyware, ransomware' },
            { id: 'T3', name: 'Social engineering attacks: phishing, spear phishing, vishing' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Cryptography & Access Control',
          topics: [
            { id: 'T1', name: 'Symmetric encryption (DES, AES) and Asymmetric encryption (RSA)' },
            { id: 'T2', name: 'Hash functions (MD5, SHA-256) and digital signatures' },
            { id: 'T3', name: 'Authentication, passwords, MFA and role-based access control (RBAC)' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Network Security & Defense Systems',
          topics: [
            { id: 'T1', name: 'Firewalls: packet filtering, stateful, and application layer' },
            { id: 'T2', name: 'Intrusion Detection (IDS) and Intrusion Prevention Systems (IPS)' },
            { id: 'T3', name: 'Virtual Private Networks (VPN) and SSL/TLS secure communication' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Web Application Security & OWASP Top 10',
          topics: [
            { id: 'T1', name: 'SQL Injection (SQLi) mechanics and defensive parameterization' },
            { id: 'T2', name: 'Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)' },
            { id: 'T3', name: 'Secure coding guidelines and vulnerability scanners' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Cyber Laws & Information Security Governance',
          topics: [
            { id: 'T1', name: 'Information Technology Act 2000 (IT Act) provisions and amendments' },
            { id: 'T2', name: 'Cyber forensics, evidence collection and incident response lifecycle' }
          ]
        }
      ]
    },
    {
      name: 'Python Programming',
      code: 'BCC302',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Python syntax, data types, functions and programming.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Python Basics & Flow Control',
          topics: [
            { id: 'T1', name: 'Python interpreter, variables, dynamic typing and keywords' },
            { id: 'T2', name: 'Operators: arithmetic, assignment, logical, identity, membership' },
            { id: 'T3', name: 'Conditional branches (if-elif-else) and loops (while, for, range)' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Built-in Data Structures',
          topics: [
            { id: 'T1', name: 'Lists: slicing, methods, indexing and list comprehensions' },
            { id: 'T2', name: 'Tuples and sets: immutability, uniqueness and set operations' },
            { id: 'T3', name: 'Dictionaries: keys, values, dictionary comprehensions' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Functions & Modular Code',
          topics: [
            { id: 'T1', name: 'Function definitions, default arguments, *args and **kwargs' },
            { id: 'T2', name: 'Lambda functions, map, filter and reduce' },
            { id: 'T3', name: 'Modules import, standard libraries (math, random, os) and namespaces' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Object-Oriented Programming in Python',
          topics: [
            { id: 'T1', name: 'Classes, instances, __init__ constructor, and self' },
            { id: 'T2', name: 'Inheritance: single, multiple and method resolution order (MRO)' },
            { id: 'T3', name: 'Method overriding and operator overloading (__str__, __add__)' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — File I/O & Exception Handling',
          topics: [
            { id: 'T1', name: 'File operations: open, read, write, append with context managers' },
            { id: 'T2', name: 'Exception handling: try, except, else, finally blocks' },
            { id: 'T3', name: 'Raising exceptions and creating user-defined exceptions' }
          ]
        }
      ]
    },
    {
      name: 'Internship Assessment / Mini Project',
      code: 'BCC351',
      credits: 2,
      ltp: 'Project / assessment',
      category: 'Assessment',
      academicYear: 'Second Year',
      semester: 3,
      shortSyllabus: 'Assessment of summer internship or mini-project, as prescribed.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Problem Definition & Methodology',
          topics: [
            { id: 'T1', name: 'Industrial problem formulation or research project scoping' },
            { id: 'T2', name: 'System requirement analysis and architectural design' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Execution, Report & Technical Viva',
          topics: [
            { id: 'T1', name: 'Project implementation, testing and demonstration' },
            { id: 'T2', name: 'Formal internship report submission and viva defense' }
          ]
        }
      ]
    }
  ],

  // ══════════════════════════════════════════════════════════════
  // YEAR 2 • BCS-SERIES CSE / ALLIED BRANCHES — SEMESTER IV
  // ══════════════════════════════════════════════════════════════
  4: [
    {
      name: 'Mathematics III, IV or V',
      code: 'BAS403',
      credits: 4,
      ltp: '3-1-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Branch-appropriate advanced engineering mathematics: partial differential equations and transform techniques.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Partial Differential Equations (PDEs)',
          topics: [
            { id: 'T1', name: 'Formation of PDEs and classification of first-order PDEs' },
            { id: 'T2', name: 'Lagrange linear partial differential equations' },
            { id: 'T3', name: 'Non-linear PDEs of first order: Charpit method' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Higher Order Linear PDEs with Constant Coefficients',
          topics: [
            { id: 'T1', name: 'Homogeneous and non-homogeneous linear PDEs' },
            { id: 'T2', name: 'Complementary functions and particular integrals' },
            { id: 'T3', name: 'Equations reducible to linear PDEs with constant coefficients' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Applications of PDEs in Engineering',
          topics: [
            { id: 'T1', name: 'Method of separation of variables' },
            { id: 'T2', name: 'One-dimensional wave equation (vibrating string)' },
            { id: 'T3', name: 'One-dimensional heat flow equation' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Fourier Series & Transforms',
          topics: [
            { id: 'T1', name: 'Periodic functions, Dirichlet conditions, Fourier series' },
            { id: 'T2', name: 'Half-range Fourier sine and cosine series' },
            { id: 'T3', name: 'Fourier transform and properties' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Statistical & Curve Analysis',
          topics: [
            { id: 'T1', name: 'Curve fitting: linear and polynomial least-squares' },
            { id: 'T2', name: 'Correlation coefficient and lines of regression' }
          ]
        }
      ]
    },
    {
      name: 'Science-Based Open Elective',
      code: 'BOE4**',
      credits: 4,
      ltp: '3-1-0',
      category: 'Elective',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Approved science-based open elective course according to institution curriculum scheme.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Scientific Concepts & Analytical Methods',
          topics: [
            { id: 'T1', name: 'Mathematical foundations of physical phenomena' },
            { id: 'T2', name: 'System modeling and energy formulations' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Quantitative Analysis & Systems',
          topics: [
            { id: 'T1', name: 'Continuum mechanics and system state definitions' },
            { id: 'T2', name: 'Equilibrium dynamics and transfer functions' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Physical & Chemical Phenomenologies',
          topics: [
            { id: 'T1', name: 'Phase transformations and transport properties' },
            { id: 'T2', name: 'Optical and electromagnetic material interactions' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Sensor & Transducer Technology',
          topics: [
            { id: 'T1', name: 'Transducer principles: capacitive, inductive, piezoelectric' },
            { id: 'T2', name: 'Signal conditioning and measurement interfaces' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Interdisciplinary Engineering Case Studies',
          topics: [
            { id: 'T1', name: 'Computational implementations of science theories' },
            { id: 'T2', name: 'Applied technology innovations from basic sciences' }
          ]
        }
      ]
    },
    {
      name: 'Technical Communication',
      code: 'BAS401',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Communication and professional writing.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Technical Discourse & Stylistics',
          topics: [
            { id: 'T1', name: 'Discourse analysis and structural rhetoric' },
            { id: 'T2', name: 'Tone, objectivity and technical conciseness' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Advanced Documentation & Technical Reports',
          topics: [
            { id: 'T1', name: 'Feasibility reports, progress reports, evaluation reports' },
            { id: 'T2', name: 'Engineering specifications and technical documentation standards' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Professional Presentations & Pitching',
          topics: [
            { id: 'T1', name: 'Structuring technical presentations and handling Q&A sessions' },
            { id: 'T2', name: 'Pitch decks for innovations and project defenses' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Organizational & Cross-Cultural Communication',
          topics: [
            { id: 'T1', name: 'Corporate communication channels and ethics' },
            { id: 'T2', name: 'Cross-cultural negotiation and collaboration in tech' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Career Communication & Viva Strategies',
          topics: [
            { id: 'T1', name: 'Technical portfolio building and digital professional presence' },
            { id: 'T2', name: 'Technical viva voce examination strategies' }
          ]
        }
      ]
    },
    {
      name: 'Universal Human Values and Professional Ethics',
      code: 'BVE401',
      credits: 3,
      ltp: '2-1-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Human values, ethics and responsibility.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Holistic View of Life',
          topics: [
            { id: 'T1', name: 'Understanding the harmony of human life in totality' },
            { id: 'T2', name: 'Continuous happiness and fulfillment through right understanding' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Self-Exploration and Inner Harmony',
          topics: [
            { id: 'T1', name: 'Co-existence of Self and Body in everyday living' },
            { id: 'T2', name: 'Self-regulation and physical health harmony' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Interpersonal Values & Social Order',
          topics: [
            { id: 'T1', name: 'Values in human relationships: trust, respect, affection' },
            { id: 'T2', name: 'Universal human order: education, health, production, justice' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Harmony in the Universal Order',
          topics: [
            { id: 'T1', name: 'Ecological balance, natural cycles, and environmental stewardship' },
            { id: 'T2', name: 'Co-existence as universal principle in reality' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Professional Ethics for Engineers',
          topics: [
            { id: 'T1', name: 'Ethical criteria for technology assessment' },
            { id: 'T2', name: 'Sustainable production systems and human-centric engineering' }
          ]
        }
      ]
    },
    {
      name: 'Operating System',
      code: 'BCS401',
      credits: 4,
      ltp: '3-1-0',
      category: 'Core Theory',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Processes, threads, CPU scheduling, synchronization, deadlocks, memory and file systems.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Introduction & OS Architecture',
          topics: [
            { id: 'T1', name: 'OS definition, goals, and dual-mode operation (kernel vs user mode)' },
            { id: 'T2', name: 'System calls, system programs, and OS structural design' },
            { id: 'T3', name: 'Virtual machines, containers and microkernel vs monolithic architectures' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Process Management & CPU Scheduling',
          topics: [
            { id: 'T1', name: 'Process concept, Process Control Block (PCB), process state transitions' },
            { id: 'T2', name: 'Threads: user-level vs kernel-level threads, multithreading models' },
            { id: 'T3', name: 'CPU scheduling criteria: turnaround, waiting, response times' },
            { id: 'T4', name: 'Scheduling algorithms: FCFS, SJF, SRTF, Priority, Round Robin, Multilevel Feedback' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Process Synchronization & Deadlocks',
          topics: [
            { id: 'T1', name: 'Critical Section Problem, mutual exclusion, progress, bounded waiting' },
            { id: 'T2', name: 'Peterson solution, hardware synchronization (TestAndSet), Semaphores, Monitors' },
            { id: 'T3', name: 'Classical synchronization problems: Producer-Consumer, Reader-Writer, Dining Philosophers' },
            { id: 'T4', name: 'Deadlock conditions, Resource Allocation Graphs, Deadlock Prevention and Avoidance' },
            { id: 'T5', name: 'Banker algorithm for deadlock avoidance, Detection and Recovery' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Memory Management & Virtual Memory',
          topics: [
            { id: 'T1', name: 'Logical vs physical address space, contiguous allocation, fragmentation' },
            { id: 'T2', name: 'Paging: page tables, Translation Lookaside Buffer (TLB), Segmentation' },
            { id: 'T3', name: 'Virtual memory: Demand paging, page fault handling mechanism' },
            { id: 'T4', name: 'Page replacement algorithms: FIFO, Optimal, LRU, Counting-based' },
            { id: 'T5', name: 'Thrashing, working set model and page fault frequency' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — File Systems & Storage Management',
          topics: [
            { id: 'T1', name: 'File concept, access methods, directory structures, protection' },
            { id: 'T2', name: 'File system implementation: allocation methods (contiguous, linked, indexed)' },
            { id: 'T3', name: 'Free-space management: bit vectors, linked lists, grouping' },
            { id: 'T4', name: 'Disk structure, disk scheduling: FCFS, SSTF, SCAN, C-SCAN, LOOK' }
          ]
        }
      ]
    },
    {
      name: 'Theory of Automata and Formal Languages',
      code: 'BCS402',
      credits: 4,
      ltp: '3-1-0',
      category: 'Core Theory',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Finite automata, regular expressions, grammars, pushdown automata and Turing machines.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Finite Automata & Regular Expressions',
          topics: [
            { id: 'T1', name: 'Alphabets, strings, languages, and finite automata definitions' },
            { id: 'T2', name: 'Deterministic Finite Automata (DFA) and Non-deterministic Finite Automata (NFA)' },
            { id: 'T3', name: 'Equivalence of NFA and DFA (Subset construction), NFA with epsilon transitions' },
            { id: 'T4', name: 'Minimization of DFA (Myhill-Nerode theorem / Table-filling method)' },
            { id: 'T5', name: 'Regular expressions, Arden theorem, and Pumping Lemma for Regular Languages' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Context-Free Grammars & Languages (CFG & CFL)',
          topics: [
            { id: 'T1', name: 'Chomsky hierarchy of languages and grammars' },
            { id: 'T2', name: 'Context-Free Grammar (CFG) definition, derivations, and parse trees' },
            { id: 'T3', name: 'Ambiguity in grammars and inherent ambiguity of languages' },
            { id: 'T4', name: 'Simplification of CFG: eliminating useless symbols, epsilon, unit productions' },
            { id: 'T5', name: 'Normal forms: Chomsky Normal Form (CNF) and Greibach Normal Form (GNF)' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Pushdown Automata (PDA)',
          topics: [
            { id: 'T1', name: 'Pushdown Automaton definition, instantaneous descriptions (ID)' },
            { id: 'T2', name: 'Acceptance by final state and acceptance by empty stack' },
            { id: 'T3', name: 'Equivalence of PDA and Context-Free Grammar' },
            { id: 'T4', name: 'Deterministic PDA (DPDA) vs non-deterministic PDA' },
            { id: 'T5', name: 'Pumping Lemma for Context-Free Languages and closure properties' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Turing Machines & Computability',
          topics: [
            { id: 'T1', name: 'Turing Machine (TM) formal model, definition and transition function' },
            { id: 'T2', name: 'Techniques for Turing Machine construction and computation' },
            { id: 'T3', name: 'Modifications of TM: multi-tape, multi-track, non-deterministic TMs' },
            { id: 'T4', name: 'Church-Turing Thesis and Universal Turing Machine' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Decidability & Complexity Classes',
          topics: [
            { id: 'T1', name: 'Decidable and undecidable problems' },
            { id: 'T2', name: 'Halting Problem of Turing Machine and reduction proofs' },
            { id: 'T3', name: 'Post Correspondence Problem (PCP)' },
            { id: 'T4', name: 'Tractable and intractable problems: P, NP, NP-Complete and NP-Hard classes' }
          ]
        }
      ]
    },
    {
      name: 'Object-Oriented Programming with Java',
      code: 'BCS403',
      credits: 3,
      ltp: '2-1-0',
      category: 'Core Theory',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Classes, objects, inheritance, polymorphism, interfaces, exceptions and Java programming.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Core OOP Principles & Java Fundamentals',
          topics: [
            { id: 'T1', name: 'OOP paradigms: encapsulation, data abstraction, inheritance, polymorphism' },
            { id: 'T2', name: 'Java platform architecture: JVM, JRE, JDK, bytecode and garbage collection' },
            { id: 'T3', name: 'Classes, objects, constructors, this keyword, static members' },
            { id: 'T4', name: 'Arrays, String and StringBuffer classes in Java' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Inheritance, Interfaces & Packages',
          topics: [
            { id: 'T1', name: 'Inheritance types, method overriding, super keyword, final keyword' },
            { id: 'T2', name: 'Abstract classes and abstract methods' },
            { id: 'T3', name: 'Interfaces: defining, implementing, multiple inheritance via interfaces' },
            { id: 'T4', name: 'Packages: creating, importing, access modifiers (public, protected, default, private)' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Exception Handling & Multithreading',
          topics: [
            { id: 'T1', name: 'Exception hierarchy: checked vs unchecked exceptions' },
            { id: 'T2', name: 'try, catch, finally, throw, and throws keywords' },
            { id: 'T3', name: 'Creating custom exception classes' },
            { id: 'T4', name: 'Thread life cycle, Thread class, Runnable interface, thread synchronization' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Java Collections Framework & Generics',
          topics: [
            { id: 'T1', name: 'Collections framework hierarchy: Collection, List, Set, Map interfaces' },
            { id: 'T2', name: 'ArrayList, LinkedList, Vector, HashSet, TreeSet, HashMap, TreeMap' },
            { id: 'T3', name: 'Iterators, ListIterator, and Comparable vs Comparator interfaces' },
            { id: 'T4', name: 'Generics classes and methods in Java' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Java I/O Streams & Event-Driven GUI',
          topics: [
            { id: 'T1', name: 'Byte streams vs Character streams, FileInputStream and FileOutputStream' },
            { id: 'T2', name: 'Buffered streams, Scanner, and Object Serialization' },
            { id: 'T3', name: 'AWT / Swing basics: JFrame, JButton, JTextField, and event listeners' }
          ]
        }
      ]
    },
    {
      name: 'Operating System Lab',
      code: 'BCS451',
      credits: 1,
      ltp: '0-0-2',
      category: 'Practical / Lab',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Operating-system commands and practical exercises on processes and system concepts.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Linux Commands & Process Control',
          topics: [
            { id: 'T1', name: 'Linux command line utilities, file permissions and redirection' },
            { id: 'T2', name: 'Shell scripting: conditional statements, loops and pattern matching' },
            { id: 'T3', name: 'Process creation using fork(), exec(), wait(), and exit() system calls' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Scheduling, Synchronization & Memory Simulation',
          topics: [
            { id: 'T1', name: 'Simulation of CPU scheduling algorithms (FCFS, SJF, Priority, Round Robin)' },
            { id: 'T2', name: 'Process synchronization using POSIX semaphores and mutex locks' },
            { id: 'T3', name: 'Simulation of FIFO and LRU page replacement algorithms' }
          ]
        }
      ]
    },
    {
      name: 'Object-Oriented Programming with Java Lab',
      code: 'BCS452',
      credits: 1,
      ltp: '0-0-2',
      category: 'Practical / Lab',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Java programming exercises using classes, inheritance, exceptions and files.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Java OOP & Interface Implementations',
          topics: [
            { id: 'T1', name: 'Class design, constructor overloading, and method overriding in Java' },
            { id: 'T2', name: 'Single and multilevel inheritance with super and abstract classes' },
            { id: 'T3', name: 'Multiple interface implementation and package creation' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Exceptions, Collections & I/O Programs',
          topics: [
            { id: 'T1', name: 'User-defined exception handling implementation' },
            { id: 'T2', name: 'Multithreaded bank/producer-consumer synchronized simulation' },
            { id: 'T3', name: 'CRUD operations using ArrayList / HashMap and File I/O serialization' }
          ]
        }
      ]
    },
    {
      name: 'Cyber Security Workshop',
      code: 'BCS453',
      credits: 1,
      ltp: '0-0-2',
      category: 'Workshop',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Cybersecurity awareness and introductory practical security exercises.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Packet Analysis & Network Scanning',
          topics: [
            { id: 'T1', name: 'Wireshark packet capture, protocol filtering and traffic inspection' },
            { id: 'T2', name: 'Nmap port scanning, service enumeration and OS detection' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Vulnerability Assessment & Web Security',
          topics: [
            { id: 'T1', name: 'Simulated SQL Injection and Cross-Site Scripting (XSS) demonstration' },
            { id: 'T2', name: 'Password hash cracking using John the Ripper / Hashcat and defense' }
          ]
        }
      ]
    },
    {
      name: 'Python Programming',
      code: 'BCC402',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Python programming / cybersecurity concepts, according to the applicable option.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Advanced Python Data & Functions',
          topics: [
            { id: 'T1', name: 'Dynamic typing, list/dict comprehensions, and generators' },
            { id: 'T2', name: 'Higher-order functions, decorators, and closures' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — OOP & Design Patterns in Python',
          topics: [
            { id: 'T1', name: 'Encapsulation, property decorators, and class methods' },
            { id: 'T2', name: 'Polymorphism and duck typing in Python' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — File I/O, Serialization & APIs',
          topics: [
            { id: 'T1', name: 'Reading/writing CSV and JSON data files' },
            { id: 'T2', name: 'Consuming REST APIs using requests library' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Scientific & Data Processing Foundations',
          topics: [
            { id: 'T1', name: 'NumPy arrays, mathematical vector operations and indexing' },
            { id: 'T2', name: 'Pandas DataFrames, data cleaning and basic filtering' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Practical Python Application Project',
          topics: [
            { id: 'T1', name: 'Building command-line utilities and automation scripts' },
            { id: 'T2', name: 'Packaging Python applications and virtual environments (venv)' }
          ]
        }
      ]
    },
    {
      name: 'Cyber Security',
      code: 'BCC401',
      credits: 2,
      ltp: '2-0-0',
      category: 'Theory',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Cybersecurity concepts, according to the applicable option.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Information Security Principles',
          topics: [
            { id: 'T1', name: 'Cyber threat landscape, attack surfaces, and defense-in-depth' },
            { id: 'T2', name: 'Security policies, risk assessment, and vulnerability management' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Applied Cryptographic Systems',
          topics: [
            { id: 'T1', name: 'Public Key Infrastructure (PKI) and Certificate Authorities (CA)' },
            { id: 'T2', name: 'Digital signatures, SSL/TLS handshake protocol and HTTPS' }
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Network & Endpoint Defense',
          topics: [
            { id: 'T1', name: 'Network segmentation, DMZ, and Next-Gen Firewalls' },
            { id: 'T2', name: 'Endpoint Detection and Response (EDR) and Antivirus architectures' }
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Cloud & Application Security',
          topics: [
            { id: 'T1', name: 'Cloud security shared responsibility model (AWS/Azure/GCP)' },
            { id: 'T2', name: 'API security, OAuth 2.0, JWT token validation and secure headers' }
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Legal Compliance & Incident Response',
          topics: [
            { id: 'T1', name: 'IT Act 2000, GDPR, and data privacy regulations' },
            { id: 'T2', name: 'Computer security incident response teams (CSIRT) workflows' }
          ]
        }
      ]
    },
    {
      name: 'Sports and Yoga-II',
      code: 'BVE451',
      credits: 0,
      isNonCredit: true,
      ltp: '0-0-3',
      category: 'Non-Credit / Audit',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Sports, yoga or community-service activities as allocated.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Physical Fitness & Asanas',
          topics: [
            { id: 'T1', name: 'Surya Namaskar 12 steps, standing and seated yoga asanas' },
            { id: 'T2', name: 'Pranayama breathing techniques and mental wellness' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Sports Skills & Team Dynamics',
          topics: [
            { id: 'T1', name: 'Athletics, badminton, table tennis or team sports rules' },
            { id: 'T2', name: 'Sportsmanship, physical endurance, and active lifestyle maintenance' }
          ]
        }
      ]
    },
    {
      name: 'NSS-II',
      code: 'BVE452',
      credits: 0,
      isNonCredit: true,
      ltp: '0-0-3',
      category: 'Non-Credit / Audit',
      academicYear: 'Second Year',
      semester: 4,
      shortSyllabus: 'Community-service activities as allocated.',
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Community Engagement & Social Initiatives',
          topics: [
            { id: 'T1', name: 'Rural outreach programs, adult literacy, and health awareness' },
            { id: 'T2', name: 'Tree plantation and environmental cleanliness drives (Swachh Bharat)' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Volunteerism & Civic Responsibility',
          topics: [
            { id: 'T1', name: 'Blood donation camps and disaster relief support training' },
            { id: 'T2', name: 'Community leadership, civic rights and social responsibility reporting' }
          ]
        }
      ]
    }
  ]
};

// ─── DOMAIN ROADMAPS (PRESERVED FOR MULTI-DOMAIN ARCHITECTURE) ────

export const DSA_ROADMAP = [
  {
    name: 'Foundation & Linear Structures',
    code: 'DSA_LIN',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — Arrays & Two Pointers',
        topics: [
          { id: 'T1', name: 'Two-Pointer Technique & Sliding Window', resourceUrl: 'https://www.youtube.com/results?search_query=sliding+window+technique+dsa' },
          { id: 'T2', name: 'Prefix Sums, Kadane Algorithm & Subarrays', resourceUrl: 'https://www.youtube.com/results?search_query=kadane+algorithm+explained' },
          { id: 'T3', name: 'Dutch National Flag & In-place Array Manipulation', resourceUrl: 'https://www.youtube.com/results?search_query=dutch+national+flag+algorithm' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Linked Lists & Fast-Slow Pointers',
        topics: [
          { id: 'T1', name: 'Reversal of Singly & Doubly Linked Lists', resourceUrl: 'https://www.youtube.com/results?search_query=reverse+linked+list+leetcode' },
          { id: 'T2', name: 'Floyd Cycle Detection & Intersection of Two Lists', resourceUrl: 'https://www.youtube.com/results?search_query=floyd+cycle+detection+algorithm' }
        ]
      }
    ]
  },
  {
    name: 'Stacks, Queues & Recursion',
    code: 'DSA_STACK',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — Monotonic Stacks & Applications',
        topics: [
          { id: 'T1', name: 'Next Greater Element & Daily Temperatures', resourceUrl: 'https://www.youtube.com/results?search_query=monotonic+stack+next+greater+element' },
          { id: 'T2', name: 'Largest Rectangle in Histogram & Trapping Rain Water', resourceUrl: 'https://www.youtube.com/results?search_query=trapping+rain+water+leetcode' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Recursion & Backtracking',
        topics: [
          { id: 'T1', name: 'Subsets, Combinations & Permutations', resourceUrl: 'https://www.youtube.com/results?search_query=backtracking+subsets+permutations' },
          { id: 'T2', name: 'N-Queens, Sudoku Solver & Word Search', resourceUrl: 'https://www.youtube.com/results?search_query=n+queens+backtracking+visualized' }
        ]
      }
    ]
  },
  {
    name: 'Trees, Graphs & Dynamic Programming',
    code: 'DSA_ADV',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — Binary Trees & Binary Search Trees',
        topics: [
          { id: 'T1', name: 'Tree Traversals (Recursive & Iterative Morris)', resourceUrl: 'https://www.youtube.com/results?search_query=binary+tree+traversals+iterative' },
          { id: 'T2', name: 'Lowest Common Ancestor (LCA) & Path Sum Problems', resourceUrl: 'https://www.youtube.com/results?search_query=lowest+common+ancestor+binary+tree' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Graphs & Dynamic Programming',
        topics: [
          { id: 'T1', name: 'Dijkstra, Bellman-Ford & Disjoint Set Union (DSU)', resourceUrl: 'https://www.youtube.com/results?search_query=dijkstra+algorithm+graph' },
          { id: 'T2', name: '0/1 Knapsack, Longest Common Subsequence & DP States', resourceUrl: 'https://www.youtube.com/results?search_query=dynamic+programming+knapsack+lcs' }
        ]
      }
    ]
  }
];

export const WEBDEV_ROADMAP = [
  {
    name: 'Frontend Core (HTML, CSS & UI Design)',
    code: 'WEB_FE',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — HTML5 & Semantic Web',
        topics: [
          { id: 'T1', name: 'Semantic Elements, Accessibility & SEO', resourceUrl: 'https://www.youtube.com/results?search_query=html5+semantic+elements+accessibility' },
          { id: 'T2', name: 'Forms, Inputs, Validations & Formspree', resourceUrl: 'https://www.youtube.com/results?search_query=html5+form+validation' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Modern CSS & Responsive Layouts',
        topics: [
          { id: 'T1', name: 'CSS Flexbox & Dynamic Alignment', resourceUrl: 'https://www.youtube.com/results?search_query=css+flexbox+complete+guide' },
          { id: 'T2', name: 'CSS Grid & Responsive Dashboard Layouts', resourceUrl: 'https://www.youtube.com/results?search_query=css+grid+tutorial' },
          { id: 'T3', name: 'CSS Variables, Animations & Dark Mode', resourceUrl: 'https://www.youtube.com/results?search_query=css+custom+properties+variables' }
        ]
      }
    ]
  },
  {
    name: 'JavaScript & Web APIs',
    code: 'WEB_JS',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — Core JavaScript & ES6+',
        topics: [
          { id: 'T1', name: 'Scope, Closures & The Event Loop', resourceUrl: 'https://www.youtube.com/results?search_query=javascript+event+loop+explained' },
          { id: 'T2', name: 'DOM Manipulation & Event Delegation', resourceUrl: 'https://www.youtube.com/results?search_query=javascript+dom+manipulation' },
          { id: 'T3', name: 'Promises, Async/Await & Fetch API', resourceUrl: 'https://www.youtube.com/results?search_query=javascript+async+await+fetch' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Browser APIs & Storage',
        topics: [
          { id: 'T1', name: 'localStorage, sessionStorage & Cookies', resourceUrl: 'https://www.youtube.com/results?search_query=localstorage+sessionstorage+javascript' },
          { id: 'T2', name: 'Chrome Extensions & Manifest V3 Basics', resourceUrl: 'https://www.youtube.com/results?search_query=chrome+extension+manifest+v3' }
        ]
      }
    ]
  },
  {
    name: 'Backend, Databases & Cloud Deployments',
    code: 'WEB_BE',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — RESTful APIs & Cloud Datastores',
        topics: [
          { id: 'T1', name: 'REST API Design, Status Codes & Headers', resourceUrl: 'https://www.youtube.com/results?search_query=rest+api+design+principles' },
          { id: 'T2', name: 'Firebase Firestore NoSQL Modeling & Security Rules', resourceUrl: 'https://www.youtube.com/results?search_query=firebase+firestore+data+modeling' },
          { id: 'T3', name: 'User Authentication, JWT & Sessions', resourceUrl: 'https://www.youtube.com/results?search_query=authentication+jwt+explained' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Deployment & Performance',
        topics: [
          { id: 'T1', name: 'Git & GitHub Collaboration Workflow', resourceUrl: 'https://www.youtube.com/results?search_query=git+github+tutorial+for+beginners' },
          { id: 'T2', name: 'Deploying Static & Web Apps to Vercel/Firebase', resourceUrl: 'https://www.youtube.com/results?search_query=deploy+to+vercel' }
        ]
      }
    ]
  }
];

// ─── GET STARTER ROADMAP FOR ANY DOMAIN ─────────────────────────
export function getDomainRoadmap(domainId, semester = 1) {
  if (domainId === 'dsa') {
    return JSON.parse(JSON.stringify(DSA_ROADMAP));
  }
  if (domainId === 'webdev') {
    return JSON.parse(JSON.stringify(WEBDEV_ROADMAP));
  }
  if (domainId === 'aktu') {
    let sem = parseInt(semester, 10) || 1;
    // Bound to semesters 1-4 supported in this update
    if (sem < 1 || sem > 4) sem = 1;
    const subjects = SYLLABUS[sem] || SYLLABUS[1];
    return JSON.parse(JSON.stringify(subjects));
  }
  // Custom domain default template
  return [
    {
      name: 'Core Module 1',
      code: 'MOD1',
      credits: 4,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Fundamentals',
          topics: [
            { id: 'T1', name: 'Introduction and Key Concepts' },
            { id: 'T2', name: 'Core Principles & Best Practices' }
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Practical Application',
          topics: [
            { id: 'T1', name: 'Hands-on Implementation' },
            { id: 'T2', name: 'Review & Self Assessment' }
          ]
        }
      ]
    }
  ];
}

// ─── GET ALL TOPICS FLAT LIST (Domain Aware) ───────────────────
export function getAllDomainTopics(domainId, semester = 1, customRoadmap = null) {
  const subjects = customRoadmap || getDomainRoadmap(domainId, semester);
  const topics = [];

  subjects.forEach(subject => {
    (subject.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        topics.push({
          key:         `${subject.code || 'SUB'}_${unit.id}_${topic.id}`,
          subjectName: subject.name,
          subjectCode: subject.code || 'SUB',
          subjectCredits: subject.credits || 0,
          unitId:      unit.id,
          unitName:    unit.name,
          topicId:     topic.id,
          topicName:   topic.name,
          resourceUrl: topic.resourceUrl || ''
        });
      });
    });
  });

  return topics;
}

// Helper: Get a flat list of all topics for an AKTU semester
export function getAllTopics(semester = 1) {
  return getAllDomainTopics('aktu', semester);
}

// Helper: Find subject by code across canonical semesters
export function getSubjectByCode(code, semester = null) {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();

  if (semester && SYLLABUS[semester]) {
    const found = SYLLABUS[semester].find(s => s.code.toUpperCase() === cleanCode);
    if (found) return found;
  }

  for (const sem of [1, 2, 3, 4]) {
    const found = SYLLABUS[sem].find(s => s.code.toUpperCase() === cleanCode);
    if (found) return found;
  }
  return null;
}

// Helper: Conservative match between video title and canonical subjects
export function matchSubjectFromTitle(title, preferredSemester = null) {
  if (!title) return null;
  const lower = title.toLowerCase();

  const semestersToCheck = preferredSemester && SYLLABUS[preferredSemester]
    ? [preferredSemester, 1, 2, 3, 4]
    : [3, 4, 1, 2];

  const seen = new Set();
  for (const sem of semestersToCheck) {
    if (seen.has(sem)) continue;
    seen.add(sem);

    const subjects = SYLLABUS[sem] || [];
    for (const sub of subjects) {
      // 1. Exact code check (e.g. BCS301, AAS101E, etc.)
      const codeClean = sub.code.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
      if (codeClean && lower.includes(codeClean)) {
        return { subject: sub, semester: sem, matchType: 'code' };
      }

      // 2. High-confidence keywords check
      const nameWords = sub.name.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['and', 'with', 'for', 'the', 'from', 'introduction'].includes(w));
      if (nameWords.length > 0) {
        const matchesAllKeyWords = nameWords.length >= 2
          ? nameWords.filter(w => lower.includes(w)).length >= 2
          : lower.includes(nameWords[0]);
        if (matchesAllKeyWords) {
          return { subject: sub, semester: sem, matchType: 'name' };
        }
      }
    }
  }

  return null;
}

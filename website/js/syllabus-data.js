/* ============================================================
   syllabus-data.js — AKTU CSE Semester-wise syllabus data.

   HOW TO USE:
   - Import this file in any JS module that needs syllabus data.
   - Usage: import { SYLLABUS } from './syllabus-data.js';
   - Then: const subjects = SYLLABUS[3];  // semester 3

   HOW TO EDIT:
   - Each subject has: name, code, credits, units[].
   - Each unit has: id, name, topics[].
   - Each topic has: id (unique within subject), name.
   - Topics are what the student checks off in the roadmap.

   ⚠️  IMPORTANT: Verify all topic names against your actual
   AKTU syllabus PDF before presenting this in your viva.
   These are representative topics — update them to match
   your exact syllabus.

   NOTE: Topic IDs must be stable (don't change them after
   data has been saved, because Firestore uses them as keys).
   ============================================================ */

export const SYLLABUS = {

  // ── SEMESTER 3 ───────────────────────────────────────────────
  3: [
    {
      name:    'Data Structures using C',
      code:    'DS',
      credits: 4,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Introduction & Arrays',
          topics: [
            { id: 'T1', name: 'Introduction to Data Structures' },
            { id: 'T2', name: 'Abstract Data Types (ADT)' },
            { id: 'T3', name: 'Arrays: 1D and 2D' },
            { id: 'T4', name: 'Array Operations (Search, Insert, Delete)' },
            { id: 'T5', name: 'Sparse Matrix Representation' },
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Stacks & Queues',
          topics: [
            { id: 'T1', name: 'Stack: Definition and Operations' },
            { id: 'T2', name: 'Stack Applications (Infix/Postfix)' },
            { id: 'T3', name: 'Queue: Definition and Operations' },
            { id: 'T4', name: 'Circular Queue' },
            { id: 'T5', name: 'Priority Queue' },
            { id: 'T6', name: 'Deque (Double-ended Queue)' },
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Linked Lists',
          topics: [
            { id: 'T1', name: 'Singly Linked List' },
            { id: 'T2', name: 'Doubly Linked List' },
            { id: 'T3', name: 'Circular Linked List' },
            { id: 'T4', name: 'Linked List vs Array' },
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Trees',
          topics: [
            { id: 'T1', name: 'Binary Tree: Traversals' },
            { id: 'T2', name: 'Binary Search Tree (BST)' },
            { id: 'T3', name: 'AVL Trees' },
            { id: 'T4', name: 'Heap and Heap Sort' },
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Graphs & Sorting',
          topics: [
            { id: 'T1', name: 'Graph Representation (Matrix, List)' },
            { id: 'T2', name: 'BFS and DFS' },
            { id: 'T3', name: 'Sorting: Bubble, Selection, Insertion' },
            { id: 'T4', name: 'Sorting: Merge Sort, Quick Sort' },
            { id: 'T5', name: 'Hashing and Hash Functions' },
          ]
        },
      ]
    },

    {
      name:    'Object Oriented Programming (OOP)',
      code:    'OOP',
      credits: 4,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — OOP Concepts',
          topics: [
            { id: 'T1', name: 'Procedural vs Object Oriented' },
            { id: 'T2', name: 'Classes and Objects' },
            { id: 'T3', name: 'Data Members and Member Functions' },
            { id: 'T4', name: 'Access Specifiers' },
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Constructors & Destructors',
          topics: [
            { id: 'T1', name: 'Constructor Types' },
            { id: 'T2', name: 'Destructor' },
            { id: 'T3', name: 'Copy Constructor' },
            { id: 'T4', name: 'Operator Overloading' },
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Inheritance',
          topics: [
            { id: 'T1', name: 'Single Inheritance' },
            { id: 'T2', name: 'Multiple Inheritance' },
            { id: 'T3', name: 'Multilevel Inheritance' },
            { id: 'T4', name: 'Virtual Functions & Polymorphism' },
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Templates & Exception Handling',
          topics: [
            { id: 'T1', name: 'Function Templates' },
            { id: 'T2', name: 'Class Templates' },
            { id: 'T3', name: 'Exception Handling (try-catch-throw)' },
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Files & STL',
          topics: [
            { id: 'T1', name: 'File Handling in C++' },
            { id: 'T2', name: 'Standard Template Library (STL) Overview' },
            { id: 'T3', name: 'Vectors, Maps, Sets in STL' },
          ]
        },
      ]
    },

    {
      name:    'Digital Electronics & Logic Design',
      code:    'DELD',
      credits: 4,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Number Systems',
          topics: [
            { id: 'T1', name: 'Number Systems (Binary, Octal, Hex)' },
            { id: 'T2', name: 'Conversions Between Number Systems' },
            { id: 'T3', name: 'Boolean Algebra' },
            { id: 'T4', name: 'De Morgan\'s Theorem' },
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Logic Gates & Minimization',
          topics: [
            { id: 'T1', name: 'Logic Gates (AND, OR, NOT, NAND, NOR)' },
            { id: 'T2', name: 'Karnaugh Map (K-Map) Minimization' },
            { id: 'T3', name: 'Sum of Minterms / Product of Maxterms' },
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Combinational Circuits',
          topics: [
            { id: 'T1', name: 'Half Adder and Full Adder' },
            { id: 'T2', name: 'Multiplexers and Demultiplexers' },
            { id: 'T3', name: 'Encoders and Decoders' },
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Sequential Circuits',
          topics: [
            { id: 'T1', name: 'Flip-Flops (SR, JK, D, T)' },
            { id: 'T2', name: 'Counters (Synchronous and Asynchronous)' },
            { id: 'T3', name: 'Shift Registers' },
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Memory & PLDs',
          topics: [
            { id: 'T1', name: 'Memory Organisation (RAM, ROM)' },
            { id: 'T2', name: 'Programmable Logic Devices (PLA, PAL)' },
          ]
        },
      ]
    },

    {
      name:    'Mathematics III (Discrete Maths)',
      code:    'MATH3',
      credits: 4,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Set Theory & Relations',
          topics: [
            { id: 'T1', name: 'Sets, Subsets, Power Set' },
            { id: 'T2', name: 'Relations: Properties and Types' },
            { id: 'T3', name: 'Equivalence Relations and Partitions' },
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Functions & Logic',
          topics: [
            { id: 'T1', name: 'Functions: Injective, Surjective, Bijective' },
            { id: 'T2', name: 'Propositional Logic' },
            { id: 'T3', name: 'Predicates and Quantifiers' },
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Graph Theory',
          topics: [
            { id: 'T1', name: 'Graph Terminology' },
            { id: 'T2', name: 'Paths, Cycles, Connectivity' },
            { id: 'T3', name: 'Trees and Spanning Trees' },
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Algebraic Structures',
          topics: [
            { id: 'T1', name: 'Groups and Subgroups' },
            { id: 'T2', name: 'Rings and Fields' },
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Combinatorics',
          topics: [
            { id: 'T1', name: 'Permutations and Combinations' },
            { id: 'T2', name: 'Principle of Inclusion-Exclusion' },
            { id: 'T3', name: 'Recurrence Relations' },
          ]
        },
      ]
    },
  ],

  // ── SEMESTER 4 ───────────────────────────────────────────────
  4: [
    {
      name:    'Operating Systems',
      code:    'OS',
      credits: 4,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — OS Introduction',
          topics: [
            { id: 'T1', name: 'OS Functions and Structure' },
            { id: 'T2', name: 'System Calls' },
            { id: 'T3', name: 'Process Concept and PCB' },
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Process Management',
          topics: [
            { id: 'T1', name: 'CPU Scheduling Algorithms' },
            { id: 'T2', name: 'Process Synchronisation' },
            { id: 'T3', name: 'Deadlocks: Detection, Avoidance, Prevention' },
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Memory Management',
          topics: [
            { id: 'T1', name: 'Paging and Segmentation' },
            { id: 'T2', name: 'Virtual Memory and Page Replacement' },
            { id: 'T3', name: 'Thrashing' },
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — File Systems',
          topics: [
            { id: 'T1', name: 'File System Interface and Implementation' },
            { id: 'T2', name: 'Directory Structures' },
            { id: 'T3', name: 'Disk Scheduling Algorithms' },
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — I/O and Security',
          topics: [
            { id: 'T1', name: 'I/O Hardware and Software' },
            { id: 'T2', name: 'OS Security Concepts' },
          ]
        },
      ]
    },
    {
      name:    'Database Management Systems',
      code:    'DBMS',
      credits: 4,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Introduction to DBMS',
          topics: [
            { id: 'T1', name: 'Database Concepts and Architecture' },
            { id: 'T2', name: 'ER Model and Diagrams' },
            { id: 'T3', name: 'Relational Model' },
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — SQL',
          topics: [
            { id: 'T1', name: 'DDL: CREATE, ALTER, DROP' },
            { id: 'T2', name: 'DML: SELECT, INSERT, UPDATE, DELETE' },
            { id: 'T3', name: 'Joins and Subqueries' },
            { id: 'T4', name: 'Aggregate Functions and GROUP BY' },
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Normalisation',
          topics: [
            { id: 'T1', name: 'Functional Dependencies' },
            { id: 'T2', name: '1NF, 2NF, 3NF' },
            { id: 'T3', name: 'BCNF' },
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Transactions',
          topics: [
            { id: 'T1', name: 'ACID Properties' },
            { id: 'T2', name: 'Concurrency Control (Locking, Timestamp)' },
            { id: 'T3', name: 'Recovery Techniques' },
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Indexing & NoSQL',
          topics: [
            { id: 'T1', name: 'Indexing: B-Tree, B+ Tree' },
            { id: 'T2', name: 'Introduction to NoSQL Databases' },
          ]
        },
      ]
    },
    {
      name:    'Computer Networks',
      code:    'CN',
      credits: 4,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Network Fundamentals',
          topics: [
            { id: 'T1', name: 'Network Types and Topologies' },
            { id: 'T2', name: 'OSI Model (7 Layers)' },
            { id: 'T3', name: 'TCP/IP Model' },
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Data Link Layer',
          topics: [
            { id: 'T1', name: 'Framing and Error Detection' },
            { id: 'T2', name: 'Flow Control Protocols' },
            { id: 'T3', name: 'MAC Protocols (Ethernet, CSMA)' },
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Network Layer',
          topics: [
            { id: 'T1', name: 'IP Addressing and Subnetting' },
            { id: 'T2', name: 'Routing Algorithms (Dijkstra, RIP, OSPF)' },
            { id: 'T3', name: 'IPv6 Basics' },
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Transport Layer',
          topics: [
            { id: 'T1', name: 'TCP: Connection Setup and Teardown' },
            { id: 'T2', name: 'UDP: Features and Use Cases' },
            { id: 'T3', name: 'Port Numbers and Socket Concept' },
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Application Layer',
          topics: [
            { id: 'T1', name: 'DNS, HTTP, HTTPS' },
            { id: 'T2', name: 'Email Protocols (SMTP, POP3, IMAP)' },
            { id: 'T3', name: 'FTP and SSH' },
          ]
        },
      ]
    },
    {
      name:    'Software Engineering',
      code:    'SE',
      credits: 3,
      units: [
        {
          id: 'U1',
          name: 'Unit 1 — Introduction',
          topics: [
            { id: 'T1', name: 'Software Process Models' },
            { id: 'T2', name: 'SDLC Phases' },
            { id: 'T3', name: 'Agile Development' },
          ]
        },
        {
          id: 'U2',
          name: 'Unit 2 — Requirements',
          topics: [
            { id: 'T1', name: 'Requirements Engineering' },
            { id: 'T2', name: 'Use Case Diagrams' },
          ]
        },
        {
          id: 'U3',
          name: 'Unit 3 — Design',
          topics: [
            { id: 'T1', name: 'Software Design Concepts' },
            { id: 'T2', name: 'UML Diagrams Overview' },
          ]
        },
        {
          id: 'U4',
          name: 'Unit 4 — Testing',
          topics: [
            { id: 'T1', name: 'Software Testing Levels' },
            { id: 'T2', name: 'Black Box and White Box Testing' },
          ]
        },
        {
          id: 'U5',
          name: 'Unit 5 — Project Management',
          topics: [
            { id: 'T1', name: 'Software Metrics and Estimation' },
            { id: 'T2', name: 'Risk Management' },
          ]
        },
      ]
    },
  ],

  // ── SEMESTER 1 (Foundations) ─────────────────────────────────
  1: [
    {
      name: 'Programming for Problem Solving (C)',
      code: 'PPS',
      credits: 4,
      units: [
        { id: 'U1', name: 'Unit 1 — Introduction to Programming & Algorithms', topics: [{ id: 'T1', name: 'Flowcharts and Pseudocode' }, { id: 'T2', name: 'C Language Fundamentals & Operators' }] },
        { id: 'U2', name: 'Unit 2 — Conditional Branching & Loops', topics: [{ id: 'T1', name: 'If-Else and Switch Statements' }, { id: 'T2', name: 'While, Do-While, and For Loops' }] },
        { id: 'U3', name: 'Unit 3 — Arrays & Strings', topics: [{ id: 'T1', name: '1D & 2D Arrays in C' }, { id: 'T2', name: 'String Functions & Manipulation' }] },
        { id: 'U4', name: 'Unit 4 — Functions & Recursion', topics: [{ id: 'T1', name: 'User Defined Functions & Parameter Passing' }, { id: 'T2', name: 'Recursion Principles' }] },
        { id: 'U5', name: 'Unit 5 — Pointers & File Handling', topics: [{ id: 'T1', name: 'Pointers & Dynamic Memory Allocation' }, { id: 'T2', name: 'File Operations in C' }] }
      ]
    },
    {
      name: 'Engineering Mathematics I',
      code: 'MATH1',
      credits: 4,
      units: [
        { id: 'U1', name: 'Unit 1 — Matrices & Determinants', topics: [{ id: 'T1', name: 'Rank of a Matrix' }, { id: 'T2', name: 'Eigenvalues & Cayley-Hamilton Theorem' }] },
        { id: 'U2', name: 'Unit 2 — Differential Calculus', topics: [{ id: 'T1', name: 'Partial Differentiation' }, { id: 'T2', name: 'Euler’s Theorem on Homogeneous Functions' }] },
        { id: 'U3', name: 'Unit 3 — Vector Calculus', topics: [{ id: 'T1', name: 'Gradient, Divergence and Curl' }, { id: 'T2', name: 'Green, Gauss & Stokes Theorems' }] }
      ]
    }
  ],

  // ── SEMESTER 2 ───────────────────────────────────────────────
  2: [
    {
      name: 'Engineering Chemistry / Physics',
      code: 'PHYS',
      credits: 4,
      units: [
        { id: 'U1', name: 'Unit 1 — Wave Optics & Quantum Mechanics', topics: [{ id: 'T1', name: 'Interference & Diffraction' }, { id: 'T2', name: 'Schrodinger Wave Equation' }] },
        { id: 'U2', name: 'Unit 2 — Lasers & Optical Fibers', topics: [{ id: 'T1', name: 'Laser Action & Ruby/He-Ne Laser' }, { id: 'T2', name: 'Numerical Aperture in Optical Fiber' }] }
      ]
    },
    {
      name: 'Basic Electrical Engineering',
      code: 'BEE',
      credits: 4,
      units: [
        { id: 'U1', name: 'Unit 1 — DC Circuit Analysis', topics: [{ id: 'T1', name: 'Kirchhoff’s Laws & Node/Mesh Analysis' }, { id: 'T2', name: 'Thevenin & Norton Theorems' }] },
        { id: 'U2', name: 'Unit 2 — Steady State AC Circuits', topics: [{ id: 'T1', name: 'Phasor Representation & Power Factor' }, { id: 'T2', name: 'Three-Phase Balanced Circuits' }] }
      ]
    }
  ],

  // ── SEMESTER 5 ───────────────────────────────────────────────
  5: [
    {
      name: 'Database Management Systems',
      code: 'DBMS',
      credits: 4,
      units: [
        { id: 'U1', name: 'Unit 1 — Introduction & ER Modeling', topics: [{ id: 'T1', name: 'DBMS Architecture & Data Models' }, { id: 'T2', name: 'ER Diagrams & Relational Mapping' }] },
        { id: 'U2', name: 'Unit 2 — Relational Algebra & SQL', topics: [{ id: 'T1', name: 'Relational Algebra Operators' }, { id: 'T2', name: 'Complex SQL Queries & Joins' }] },
        { id: 'U3', name: 'Unit 3 — Normalization', topics: [{ id: 'T1', name: 'Functional Dependencies' }, { id: 'T2', name: '1NF, 2NF, 3NF, BCNF' }] },
        { id: 'U4', name: 'Unit 4 — Transaction Processing', topics: [{ id: 'T1', name: 'ACID Properties & Serializability' }, { id: 'T2', name: 'Concurrency Control & Locking' }] },
        { id: 'U5', name: 'Unit 5 — Recovery & Indexing', topics: [{ id: 'T1', name: 'Log-based Recovery & Checkpoints' }, { id: 'T2', name: 'B-Trees and B+ Trees Indexing' }] }
      ]
    },
    {
      name: 'Design and Analysis of Algorithms',
      code: 'DAA',
      credits: 4,
      units: [
        { id: 'U1', name: 'Unit 1 — Asymptotic Analysis & Recurrences', topics: [{ id: 'T1', name: 'Big-O, Omega, Theta Notations' }, { id: 'T2', name: 'Master Method & Recursion Tree' }] },
        { id: 'U2', name: 'Unit 2 — Divide and Conquer & Greedy', topics: [{ id: 'T1', name: 'Merge Sort, Quick Sort' }, { id: 'T2', name: 'Huffman Coding & Fractional Knapsack' }] },
        { id: 'U3', name: 'Unit 3 — Dynamic Programming', topics: [{ id: 'T1', name: '0/1 Knapsack & Matrix Chain' }, { id: 'T2', name: 'Longest Common Subsequence (LCS)' }] },
        { id: 'U4', name: 'Unit 4 — Graph Algorithms', topics: [{ id: 'T1', name: 'Dijkstra & Bellman-Ford Algorithm' }, { id: 'T2', name: 'Floyd-Warshall & MST (Prim/Kruskal)' }] }
      ]
    }
  ],

  // ── SEMESTER 6 ───────────────────────────────────────────────
  6: [
    {
      name: 'Computer Networks',
      code: 'CN',
      credits: 4,
      units: [
        { id: 'U1', name: 'Unit 1 — Physical Layer & Reference Models', topics: [{ id: 'T1', name: 'OSI vs TCP/IP Models' }, { id: 'T2', name: 'Transmission Media & Switching' }] },
        { id: 'U2', name: 'Unit 2 — Data Link Layer', topics: [{ id: 'T1', name: 'Error Detection: CRC, Checksum' }, { id: 'T2', name: 'Flow Control & Sliding Window' }] },
        { id: 'U3', name: 'Unit 3 — Network Layer', topics: [{ id: 'T1', name: 'IPv4/IPv6 Addressing & Subnetting' }, { id: 'T2', name: 'Routing: Distance Vector & Link State' }] },
        { id: 'U4', name: 'Unit 4 — Transport Layer', topics: [{ id: 'T1', name: 'TCP 3-Way Handshake & Flow Control' }, { id: 'T2', name: 'UDP Protocol & Congestion Control' }] },
        { id: 'U5', name: 'Unit 5 — Application Layer', topics: [{ id: 'T1', name: 'DNS, HTTP/HTTPS, FTP, SMTP' }, { id: 'T2', name: 'Network Security Basics (RSA, AES)' }] }
      ]
    },
    {
      name: 'Compiler Design',
      code: 'CD',
      credits: 4,
      units: [
        { id: 'U1', name: 'Unit 1 — Lexical Analysis', topics: [{ id: 'T1', name: 'Phases of a Compiler' }, { id: 'T2', name: 'Regular Expressions & Lexical Errors' }] },
        { id: 'U2', name: 'Unit 2 — Syntax Analysis', topics: [{ id: 'T1', name: 'LL(1) Parsing' }, { id: 'T2', name: 'LR, SLR, LALR Parsers' }] }
      ]
    }
  ],

  // ── SEMESTER 7 ───────────────────────────────────────────────
  7: [
    {
      name: 'Artificial Intelligence',
      code: 'AI',
      credits: 3,
      units: [
        { id: 'U1', name: 'Unit 1 — Search Strategies', topics: [{ id: 'T1', name: 'BFS, DFS, Uniform Cost Search' }, { id: 'T2', name: 'A* Search & Heuristics' }] },
        { id: 'U2', name: 'Unit 2 — Knowledge Representation', topics: [{ id: 'T1', name: 'Propositional & First Order Logic' }, { id: 'T2', name: 'Resolution & Forward/Backward Chaining' }] }
      ]
    },
    {
      name: 'Cloud Computing',
      code: 'CLOUD',
      credits: 3,
      units: [
        { id: 'U1', name: 'Unit 1 — Cloud Architecture', topics: [{ id: 'T1', name: 'IaaS, PaaS, SaaS Service Models' }, { id: 'T2', name: 'Virtualization & Hypervisors' }] },
        { id: 'U2', name: 'Unit 2 — Cloud Security & Storage', topics: [{ id: 'T1', name: 'Cloud Storage & S3 concepts' }, { id: 'T2', name: 'Data Security and Compliance' }] }
      ]
    }
  ],

  // ── SEMESTER 8 ───────────────────────────────────────────────
  8: [
    {
      name: 'Distributed Systems',
      code: 'DSYS',
      credits: 3,
      units: [
        { id: 'U1', name: 'Unit 1 — Distributed Architecture', topics: [{ id: 'T1', name: 'RPC and RMI Communication' }, { id: 'T2', name: 'Logical Clocks & Lamport Timestamps' }] },
        { id: 'U2', name: 'Unit 2 — Consensus & Fault Tolerance', topics: [{ id: 'T1', name: 'Two-Phase Commit Protocol' }, { id: 'T2', name: 'Paxos and Raft Consensus' }] }
      ]
    }
  ]
};

// ─── DOMAIN 2: DATA STRUCTURES & ALGORITHMS (DSA) ROADMAP ─────
export const DSA_ROADMAP = [
  {
    name: 'Arrays & Two Pointers',
    code: 'DSA_ARR',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — Arrays & Hash Maps',
        topics: [
          { id: 'T1', name: 'Prefix Sum & Running Totals', resourceUrl: 'https://www.youtube.com/results?search_query=prefix+sum+arrays+dsa' },
          { id: 'T2', name: 'Two Sum & Hash Table Lookups', resourceUrl: 'https://www.youtube.com/results?search_query=two+sum+hashmap+dsa' },
          { id: 'T3', name: 'Kadane’s Algorithm (Max Subarray)', resourceUrl: 'https://www.youtube.com/results?search_query=kadane+algorithm+explained' },
          { id: 'T4', name: 'Dutch National Flag (Sort 0s, 1s, 2s)', resourceUrl: 'https://www.youtube.com/results?search_query=sort+colors+dutch+flag' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Two Pointers & Sliding Window',
        topics: [
          { id: 'T1', name: 'Container With Most Water', resourceUrl: 'https://www.youtube.com/results?search_query=container+with+most+water' },
          { id: 'T2', name: 'Trapping Rain Water', resourceUrl: 'https://www.youtube.com/results?search_query=trapping+rain+water+dsa' },
          { id: 'T3', name: 'Longest Substring Without Repeating Characters', resourceUrl: 'https://www.youtube.com/results?search_query=sliding+window+longest+substring' }
        ]
      }
    ]
  },
  {
    name: 'Linked Lists, Stacks & Queues',
    code: 'DSA_LSTK',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — Linked List Patterns',
        topics: [
          { id: 'T1', name: 'Reverse a Linked List (Iterative & Recursive)', resourceUrl: 'https://www.youtube.com/results?search_query=reverse+linked+list+dsa' },
          { id: 'T2', name: 'Fast & Slow Pointers (Floyd Cycle Detection)', resourceUrl: 'https://www.youtube.com/results?search_query=floyd+cycle+detection+linked+list' },
          { id: 'T3', name: 'Merge Two Sorted Lists', resourceUrl: 'https://www.youtube.com/results?search_query=merge+two+sorted+lists' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Monotonic Stack & Queues',
        topics: [
          { id: 'T1', name: 'Valid Parentheses & Stack Basics', resourceUrl: 'https://www.youtube.com/results?search_query=valid+parentheses+stack' },
          { id: 'T2', name: 'Next Greater Element using Monotonic Stack', resourceUrl: 'https://www.youtube.com/results?search_query=next+greater+element+monotonic+stack' },
          { id: 'T3', name: 'Sliding Window Maximum with Deque', resourceUrl: 'https://www.youtube.com/results?search_query=sliding+window+maximum+deque' }
        ]
      }
    ]
  },
  {
    name: 'Trees & Graphs',
    code: 'DSA_TRGR',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — Binary Trees & BST',
        topics: [
          { id: 'T1', name: 'Tree Traversals (Inorder, Preorder, Postorder, Level-Order)', resourceUrl: 'https://www.youtube.com/results?search_query=binary+tree+traversals+dsa' },
          { id: 'T2', name: 'Maximum Depth & Diameter of Binary Tree', resourceUrl: 'https://www.youtube.com/results?search_query=diameter+of+binary+tree' },
          { id: 'T3', name: 'Validate Binary Search Tree (BST)', resourceUrl: 'https://www.youtube.com/results?search_query=validate+binary+search+tree' }
        ]
      },
      {
        id: 'U2',
        name: 'Unit 2 — Graphs & Traversal',
        topics: [
          { id: 'T1', name: 'Graph Representation (Adj Matrix & List)', resourceUrl: 'https://www.youtube.com/results?search_query=graph+representation+dsa' },
          { id: 'T2', name: 'Breadth First Search (BFS) & Shortest Path', resourceUrl: 'https://www.youtube.com/results?search_query=bfs+graph+traversal' },
          { id: 'T3', name: 'Depth First Search (DFS) & Connected Components', resourceUrl: 'https://www.youtube.com/results?search_query=dfs+graph+connected+components' },
          { id: 'T4', name: 'Dijkstra’s Shortest Path Algorithm', resourceUrl: 'https://www.youtube.com/results?search_query=dijkstra+algorithm+explained' }
        ]
      }
    ]
  },
  {
    name: 'Dynamic Programming',
    code: 'DSA_DP',
    credits: 4,
    units: [
      {
        id: 'U1',
        name: 'Unit 1 — 1D & 2D Dynamic Programming',
        topics: [
          { id: 'T1', name: 'Climbing Stairs & Fibonacci Memoization', resourceUrl: 'https://www.youtube.com/results?search_query=climbing+stairs+dynamic+programming' },
          { id: 'T2', name: 'House Robber & Maximum Non-Adjacent Sum', resourceUrl: 'https://www.youtube.com/results?search_query=house+robber+dp' },
          { id: 'T3', name: 'Coin Change Problem (Min Coins)', resourceUrl: 'https://www.youtube.com/results?search_query=coin+change+problem+dp' },
          { id: 'T4', name: '0/1 Knapsack Problem', resourceUrl: 'https://www.youtube.com/results?search_query=0+1+knapsack+dp' },
          { id: 'T5', name: 'Longest Common Subsequence (LCS)', resourceUrl: 'https://www.youtube.com/results?search_query=longest+common+subsequence+dp' }
        ]
      }
    ]
  }
];

// ─── DOMAIN 3: WEB DEVELOPMENT ROADMAP ─────────────────────────
export const WEBDEV_ROADMAP = [
  {
    name: 'Frontend Fundamentals',
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
    name: 'Backend, Databases & APIs',
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
export function getDomainRoadmap(domainId, semester = 3) {
  if (domainId === 'dsa') {
    return JSON.parse(JSON.stringify(DSA_ROADMAP));
  }
  if (domainId === 'webdev') {
    return JSON.parse(JSON.stringify(WEBDEV_ROADMAP));
  }
  if (domainId === 'aktu') {
    const sem = parseInt(semester, 10) || 3;
    const subjects = SYLLABUS[sem] || SYLLABUS[3];
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
export function getAllDomainTopics(domainId, semester = 3, customRoadmap = null) {
  const subjects = customRoadmap || getDomainRoadmap(domainId, semester);
  const topics = [];

  subjects.forEach(subject => {
    (subject.units || []).forEach(unit => {
      (unit.topics || []).forEach(topic => {
        topics.push({
          key:         `${subject.code || 'SUB'}_${unit.id}_${topic.id}`,
          subjectName: subject.name,
          subjectCode: subject.code || 'SUB',
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

// Helper: Get a flat list of all topics for a semester (AKTU)
export function getAllTopics(semester) {
  return getAllDomainTopics('aktu', semester);
}


export interface Project {
    title: string;
    date: string;
    description: string[];
    metrics: { label: string; value: string; }[];
    tech: string[];
}

export interface Experience {
    company: string;
    role: string;
    location: string;
    date: string;
    bullets: string[];
}

export interface ResumeData {
    name: string;
    contact: {
        phone: string;
        email: string;
        linkedin: string;
    };
    summary: string[];
    skills: {
        category: string;
        items: string[];
    }[];
    education: {
        school: string;
        location: string;
        degree: string;
        date: string;
    }[];
    experience: Experience[];
    projects: Project[];
}

export const resumeData: ResumeData = {
    name: "Xiangyi Li",
    contact: {
        phone: "608-298-8300",
        email: "LiXiangyi1984@outlook.com",
        linkedin: "linkedin.com/in/xiangyi-li-2a1592339"
    },
    summary: [
        "Expertise: Data Science, SQL, Large-scale Data, Machine Learning, AI Agent",
        "Technical Skills: Python, R, SQL, Julia, Emacs, Spark, SAS, Tableau, power BI",
        "Programming Technical: Sklearn, Pytorch, TensorFlow"
    ],
    skills: [
        { category: "Data Science", items: ["Python", "R", "SQL", "Julia", "Spark", "SAS"] },
        { category: "Tools", items: ["Emacs", "Tableau", "Power BI", "Tableau"] },
        { category: "ML/AI", items: ["Sklearn", "Pytorch", "TensorFlow"] }
    ],
    education: [
        {
            school: "University of Wisconsin Madison",
            location: "WI",
            degree: "M.S. Statistics & Data Science",
            date: "09/2023 – 05/2025"
        },
        {
            school: "Southern University of Science and Technology",
            location: "Shenzhen",
            degree: "B.S. Statistics",
            date: "09/2020 – 07/2023"
        }
    ],
    experience: [
        {
            company: "Yu Cai Co.",
            role: "Sales Data Analyst",
            location: "Shenzhen, Guangdong",
            date: "06/2024 – 11/2024",
            bullets: [
                "Analyzed 20k sales transactions using R; performed factor analysis and K-means clustering.",
                "Designed A/B testing frameworks for marketing campaigns, achieving 4.7/5 success score.",
                "Built Time-Series models to forecast product demand and automated SQL reports."
            ]
        },
        {
            company: "Ping An Bank",
            role: "Business Data Analysis Assistant",
            location: "Shenzhen, Guangdong",
            date: "01/2022 – 04/2022",
            bullets: [
                "Automated client file management using Python and SQL database optimization.",
                "Developed forecasting models in R for 12k transaction records, improving accuracy by 8%.",
                "Conducted K-means analysis on 80k+ client profiles, increasing retention by 12%."
            ]
        }
    ],
    projects: [
        {
            title: "Diffusion-Normalizing-Flow MCMC Algorithm",
            date: "02/2024 – 06/2024",
            description: [
                "Developed a Diffusion-Normalizing-Flow MCMC algorithm combining diffusion models and normalizing flows.",
                "Improved sampling efficiency by 80% in high-dimensional spaces.",
                "Reduced noise interference by 25% via K-means clustering classification."
            ],
            metrics: [
                { label: "Efficiency", value: "80% ↑" },
                { label: "Acceptance Rate", value: "80%" }
            ],
            tech: ["Python", "Diffusion Models", "MCMC"]
        },
        {
            title: "Credit Risk Prediction Model",
            date: "01/2023",
            description: [
                "Processed 22k+ loan records using Cook's distance analysis in R.",
                "Selected 17 key variables using LASSO; achieved 96.4% R² using Random Forest.",
                "Identified 367 high-risk cases among 2,500 new loans."
            ],
            metrics: [
                { label: "Accuracy", value: "96.4% R²" },
                { label: "Error Reduct.", value: "47% ↓" }
            ],
            tech: ["R", "Random Forest", "LASSO"]
        }
        // ... Additional projects would be mapped similarly
    ]
};

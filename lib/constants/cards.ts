import type { CardData } from '@/lib/cardData';

/** plan3 完整文案（标题 + 自我介绍 + 技能 + 项目），占位由下方卡片承接 */
export const HERO_COPY = `Data Scientist

Hi, I'm Xiangyi Li, a data scientist passionate about building scalable data pipelines and intelligent analytics systems.

I work with Python, SQL, and machine learning to transform large datasets into predictive models and actionable business insights.

My work focuses on data ingestion systems, forecasting models, and large-scale analytics for real-world decision making.

— ABOUT ME —`;

/** 仅这些词参与乱码，顺序需与文案中出现顺序一致 */
export const HERO_KEY_TERMS = [
    'Data Scientist',
    'Xiangyi Li',
    'Python',
    'SQL',
    'machine learning',
    'data pipelines',
    'large-scale',
];


/** plan4 可复用卡片数据（经历、技能、项目等），details 为悬停 1.2s 后展示的详细信息 */
export const CARD_ITEMS: CardData[] = [
    {
        title: 'Experience',
        subtitle: 'Data Science & Analytics · 2022 – Present',
        description: 'Building automated data pipelines and analytics systems.\nTransforming large datasets into predictive insights.',
        details: 'Professional data science experience.\n\n• Built Python + SQL ingestion pipelines processing 20k+ records\n• Implemented ETL workflows with validation and deduplication\n• Developed forecasting and segmentation models for business decisions',
        tags: ['Python', 'SQL', 'ETL', 'Data Pipeline'],
        variant: 'experience',
    },
    {
        title: 'Skills',
        subtitle: 'Core Technologies',
        description: 'Experienced in machine learning, forecasting models, and large-scale data processing.',
        details: 'Core stack: Python, SQL, R, Spark, Scikit-learn. \n• Machine Learning: Random Forest, XGBoost, ARIMA\n• Deep Learning: PyTorch, TensorFlow\n• Data tools: Pandas, ETL workflows, analytics pipelines',
        tags: ['Python', 'SQL', 'Machine Learning', 'AI'],
        variant: 'skill',
    },
    {
        title: 'Projects',
        subtitle: 'ML & Data Systems',
        description: 'End-to-end machine learning projects from data ingestion to prediction systems.',
        details: 'Major machine learning projects.\n• Airline analytics system processing 2M flight records\n• Wordle analytics with ARIMA and XGBoost models\n• Credit risk prediction models for loan analysis',
        tags: ['Machine Learning', 'Forecasting', 'Analytics'],
        variant: 'project',
    },
];
import type { CardData } from '@/lib/cardData';

/** plan3 完整文案（标题 + 自我介绍 + 技能 + 项目），占位由下方卡片承接 */
export const HERO_COPY = `Database Developer

Hi, I'm XiangyiLi, a database and data developer passionate about building scalable data systems.

I work with SQL, Python, and machine learning to turn complex data into useful insights and reliable infrastructure.

My projects focus on data architecture, analytics platforms, and large-scale data processing.

— ABOUT ME —`;

/** 仅这些词参与乱码，顺序需与文案中出现顺序一致 */
export const HERO_KEY_TERMS = [
    'Database Developer',
    'XiangyiLi',
    'SQL',
    'Python',
    'machine learning',
    'data architecture',
    'large-scale',
];

/** plan4 可复用卡片数据（经历、技能、项目等），details 为悬停 1.2s 后展示的详细信息 */
export const CARD_ITEMS: CardData[] = [
    {
        title: 'Experience',
        subtitle: 'Database Developer · 2022 – Present',
        description: 'Building scalable data pipelines and analytics platforms.\nOptimizing queries and data architecture for large-scale systems.',
        details: 'Database Developer at scale.\n\n• Designed and maintained ETL pipelines for 10M+ daily records\n• Optimized slow queries, reducing latency by 40%\n• Led data modeling for analytics and reporting',
        tags: ['SQL', 'Python', 'ETL', 'Data Modeling'],
        variant: 'experience',
    },
    {
        title: 'Skills',
        subtitle: 'Core Technologies',
        description: 'Proficient in relational databases, data warehousing, and machine learning pipelines.',
        details: 'Core stack: SQL, Python, Spark, Airflow, dbt.\n\n• Relational DBs: PostgreSQL, MySQL\n• Data tools: Pandas, scikit-learn, TensorFlow, AWS, GCP',
        tags: ['SQL', 'Python', 'Spark', 'Airflow', 'dbt'],
        variant: 'skill',
    },
    {
        title: 'Projects',
        subtitle: 'Data & Analytics',
        description: 'End-to-end data solutions: from ingestion to dashboards.',
        details: 'Data & Analytics Projects.\n • Real-time ingestion pipeline with Kafka + Flink\n• BI dashboards (Metabase, Looker)\n• ML models for forecasting and anomaly detection',
        tags: ['Data Architecture', 'Analytics', 'ETL'],
        variant: 'project',
    },
];

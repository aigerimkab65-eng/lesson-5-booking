export interface Topic {
  id: string;
  title: string;
  durationMinutes: number;
  description: string;
}

export const TOPICS: Topic[] = [
  {
    id: "site",
    title: "Сайт (визитка, лендинг, магазин)",
    durationMinutes: 60,
    description: "Обсудим структуру, стиль и запуск сайта",
  },
  {
    id: "ai-content",
    title: "AI-контент (фото, ролики, анимация)",
    durationMinutes: 60,
    description: "Подберём формат контента под ваш бренд",
  },
  {
    id: "design",
    title: "Дизайн (карусели, карточки)",
    durationMinutes: 60,
    description: "Сделаем визуалы для соцсетей и рекламы",
  },
  {
    id: "tools",
    title: "Калькулятор, каталог или онлайн-запись для бизнеса",
    durationMinutes: 60,
    description: "Спроектируем удобный инструмент для клиентов",
  },
];

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((topic) => topic.id === id);
}


const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API Request Failed' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const api = {
  videos: {
    list: () => fetchApi('/videos'),
    get: (id: string) => fetchApi(`/video-info/${id}`),
    create: (data: { title: string, source_type: string, source_ref: string }) => fetchApi('/video-info', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: { title: string }) => fetchApi(`/video-info/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/video-info/${id}`, {
      method: 'DELETE',
    }),
  },
  upload: {
    file: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    url: (url: string) => fetchApi('/video-info', {
      method: 'POST',
      body: JSON.stringify({ 
        source_ref: url, 
        source_type: "youtube",
        title: "Video YouTube Mới" 
      }),
    }),
  },
  transcript: {
    generate: (videoId: string) => fetchApi(`/transcript/${videoId}`, {
      method: 'POST',
    }),
  },
  chat: {
    send: (videoId: string, message: string) => fetchApi(`/chat/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
    history: (videoId: string) => fetchApi(`/chat/${videoId}`),
  },
  quiz: {
    generate: (videoId: string) => fetchApi(`/quiz/generate/${videoId}`, {
      method: 'POST',
    }),
    get: (videoId: string) => fetchApi(`/quiz/${videoId}`),
    submit: (videoId: string, quizId: string, answers: number[]) => fetchApi(`/quiz/submit/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quizId, answers }),
    }),
    history: (videoId: string) => fetchApi(`/quiz/history/${videoId}`),
    analysis: (videoId: string) => fetchApi(`/quiz/analysis/${videoId}`),
  },
  summary: {
    get: (videoId: string) => fetchApi(`/summary/${videoId}`),
  },
  flashcards: {
    get: (videoId: string) => fetchApi(`/flashcards/${videoId}`),
  },
  notes: {
    get: (videoId: string) => fetchApi(`/notes/${videoId}`),
    save: (videoId: string, content: string) => fetchApi(`/notes/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  },
  studyPlan: {
    get: (videoId: string, refresh?: boolean) => fetchApi(`/study-plan/${videoId}${refresh ? '?refresh=true' : ''}`),
  },
};


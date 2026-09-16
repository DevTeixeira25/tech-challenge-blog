import { request } from './http';
import type { Post, PostInput } from '../types';

/** Chamadas aos endpoints REST de posts. */
export const postsService = {
  list(signal?: AbortSignal): Promise<Post[]> {
    return request<Post[]>('/posts', { signal });
  },

  search(term: string, signal?: AbortSignal): Promise<Post[]> {
    return request<Post[]>(`/posts/search?q=${encodeURIComponent(term)}`, {
      signal,
    });
  },

  getById(id: string, signal?: AbortSignal): Promise<Post> {
    return request<Post>(`/posts/${id}`, { signal });
  },

  create(data: PostInput): Promise<Post> {
    return request<Post>('/posts', { method: 'POST', body: data, auth: true });
  },

  update(id: string, data: PostInput): Promise<Post> {
    return request<Post>(`/posts/${id}`, {
      method: 'PUT',
      body: data,
      auth: true,
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/posts/${id}`, { method: 'DELETE', auth: true });
  },
};

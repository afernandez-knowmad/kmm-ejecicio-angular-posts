export interface Post {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
}

export type NewPost = Omit<Post, 'id'>;

export type PostPatch = Partial<NewPost>;

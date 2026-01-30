import { ForumCreationPage } from '@/components/forums/forum-creation-page'

export default function AdminForumCreationPage() {
  return <ForumCreationPage />
}

export async function generateMetadata() {
  return {
    title: 'Create New Forum | Living & Leaving Admin',
    description: 'Create a new forum for discussions and conversations',
  }
}
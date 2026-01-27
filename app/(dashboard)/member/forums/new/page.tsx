import { ForumCreationPage } from '@/components/forums/forum-creation-page'

export default function MemberForumCreationPage() {
  return <ForumCreationPage />
}

export async function generateMetadata() {
  return {
    title: 'Create New Forum | Villages Member',
    description: 'Create a new forum for discussions and conversations',
  }
}
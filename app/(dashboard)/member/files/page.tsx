import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { UserRepository } from '@/lib/db/repositories/user.repository'
import { DocumentRepository } from '@/lib/db/repositories/document.repository'
import { DocumentStatus } from '@/lib/types'
import { MemberFilesClient } from './files-client'

const userRepository = new UserRepository()
const documentRepository = new DocumentRepository()

export default async function MemberFilesPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await userRepository.getUserByClerkId(userId)
  if (!user) {
    redirect('/sign-in')
  }

  const result = await documentRepository.getDocumentsByUser(user.id, {
    status: DocumentStatus.ACTIVE,
    limit: 200,
  })

  const files = result.items.map((doc) => ({
    id: doc.id,
    title: doc.title,
    fileName: doc.originalFileName || doc.fileName,
    mimeType: doc.mimeType || 'application/octet-stream',
    fileSize: doc.fileSize ?? null,
    uploadedAt: doc.createdAt.toISOString(),
  }))

  return <MemberFilesClient initialFiles={files} />
}

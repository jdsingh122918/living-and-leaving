'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, UserPlus, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

interface UnassignedMember {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: string
  phoneNumber?: string
}

interface AddMemberContentProps {
  familyName: string
  activeTab: string
  setActiveTab: (tab: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  loadingUnassigned: boolean
  addMemberError: string | null
  filteredUnassignedMembers: UnassignedMember[]
  unassignedMembers: UnassignedMember[]
  addingMember: boolean
  addMemberToFamily: (userId: string) => void
  newMemberData: { email: string; firstName: string; lastName: string }
  setNewMemberData: React.Dispatch<React.SetStateAction<{ email: string; firstName: string; lastName: string }>>
  createMemberError: string | null
  creatingNewMember: boolean
  createNewMember: () => void
  setShowDialog: (show: boolean) => void
}

function AddMemberContent({
  familyName,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  loadingUnassigned,
  addMemberError,
  filteredUnassignedMembers,
  unassignedMembers,
  addingMember,
  addMemberToFamily,
  newMemberData,
  setNewMemberData,
  createMemberError,
  creatingNewMember,
  createNewMember,
  setShowDialog,
}: AddMemberContentProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 h-12">
        <TabsTrigger value="existing" className="min-h-[44px] text-xs sm:text-sm">
          <UserPlus className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">Add Existing</span>
        </TabsTrigger>
        <TabsTrigger value="create" className="min-h-[44px] text-xs sm:text-sm">
          <Plus className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">Create New</span>
        </TabsTrigger>
      </TabsList>

      {/* Add Existing Member Tab */}
      <TabsContent value="existing" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="member-search">Search members</Label>
          <Input
            id="member-search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        {addMemberError && (
          <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md">
            {addMemberError}
          </div>
        )}

        {loadingUnassigned && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center p-3 border rounded-lg gap-3"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-[44px] w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingUnassigned && (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredUnassignedMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-10 w-10 sm:h-8 sm:w-8 mx-auto mb-3 opacity-50" />
                <p>
                  {searchQuery
                    ? `No unassigned members found matching "${searchQuery}"`
                    : unassignedMembers.length === 0
                    ? 'No unassigned members available'
                    : 'No members match your search'}
                </p>
                {unassignedMembers.length === 0 && (
                  <p className="text-sm mt-2">
                    Try creating a new member using the &quot;New&quot; tab.
                  </p>
                )}
              </div>
            ) : (
              filteredUnassignedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback>
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phoneNumber && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{member.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 flex-shrink-0">
                    <Badge variant="secondary">{member.role}</Badge>
                    <Button
                      size="sm"
                      onClick={() => addMemberToFamily(member.id)}
                      disabled={addingMember}
                      className="min-h-[44px] px-4"
                    >
                      {addingMember ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </TabsContent>

      {/* Create New Member Tab */}
      <TabsContent value="create" className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Create a new member account</strong> and automatically assign them
            to {familyName}. They will receive an email invitation to set up their
            account.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-email">
              Email address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-email"
              type="email"
              placeholder="member@example.com"
              value={newMemberData.email}
              onChange={(e) =>
                setNewMemberData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-firstName">First name</Label>
              <Input
                id="new-firstName"
                placeholder="First name"
                value={newMemberData.firstName}
                onChange={(e) =>
                  setNewMemberData((prev) => ({ ...prev, firstName: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-lastName">Last name</Label>
              <Input
                id="new-lastName"
                placeholder="Last name"
                value={newMemberData.lastName}
                onChange={(e) =>
                  setNewMemberData((prev) => ({ ...prev, lastName: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 bg-muted/50 rounded-md">
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-xs text-muted-foreground">Automatically set to Member</p>
            </div>
            <Badge variant="secondary" className="w-fit">MEMBER</Badge>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 bg-muted/50 rounded-md">
            <div>
              <p className="text-sm font-medium">Family Assignment</p>
              <p className="text-xs text-muted-foreground">
                Will be assigned to {familyName}
              </p>
            </div>
            <Badge variant="outline" className="w-fit">{familyName}</Badge>
          </div>
        </div>

        {createMemberError && (
          <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md">
            {createMemberError}
          </div>
        )}

        <div className="flex flex-col-reverse md:flex-row md:justify-between gap-2 pt-2">
          <Button variant="outline" onClick={() => setShowDialog(false)} className="w-full md:w-auto min-h-[44px]">
            Cancel
          </Button>
          <Button
            onClick={createNewMember}
            disabled={!newMemberData.email.trim() || creatingNewMember}
            className="w-full md:w-auto min-h-[44px]"
          >
            {creatingNewMember ? 'Creating...' : 'Create & Add'}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}

interface AddFamilyMemberButtonProps {
  familyId: string
  familyName: string
  onMemberAdded?: () => void
}

export function AddFamilyMemberButton({
  familyId,
  familyName,
  onMemberAdded,
}: AddFamilyMemberButtonProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [showDialog, setShowDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('existing')

  // Existing member state
  const [unassignedMembers, setUnassignedMembers] = useState<UnassignedMember[]>([])
  const [loadingUnassigned, setLoadingUnassigned] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [addMemberError, setAddMemberError] = useState<string | null>(null)

  // Create new member state
  const [newMemberData, setNewMemberData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  })
  const [creatingNewMember, setCreatingNewMember] = useState(false)
  const [createMemberError, setCreateMemberError] = useState<string | null>(null)

  // Fetch unassigned members
  const fetchUnassignedMembers = useCallback(async () => {
    try {
      setLoadingUnassigned(true)
      setAddMemberError(null)

      const response = await fetch('/api/users/unassigned')
      if (!response.ok) {
        throw new Error('Failed to fetch unassigned members')
      }

      const data = await response.json()
      setUnassignedMembers(data.users || [])
    } catch (error) {
      console.error('Error fetching unassigned members:', error)
      setAddMemberError(
        error instanceof Error ? error.message : 'Failed to load available members'
      )
    } finally {
      setLoadingUnassigned(false)
    }
  }, [])

  // Add existing member to family
  const addMemberToFamily = useCallback(
    async (userId: string) => {
      try {
        setAddingMember(true)
        setAddMemberError(null)

        const response = await fetch(`/api/families/${familyId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add member to family')
        }

        toast.success('Member added to family successfully!')
        setShowDialog(false)
        setSearchQuery('')
        setUnassignedMembers([])
        onMemberAdded?.()
        router.refresh()
      } catch (error) {
        console.error('Error adding member to family:', error)
        setAddMemberError(
          error instanceof Error ? error.message : 'Failed to add member'
        )
      } finally {
        setAddingMember(false)
      }
    },
    [familyId, onMemberAdded, router]
  )

  // Create new member and assign to family
  const createNewMember = useCallback(async () => {
    try {
      setCreatingNewMember(true)
      setCreateMemberError(null)

      if (!newMemberData.email.trim()) {
        throw new Error('Email is required')
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMemberData.email.trim(),
          firstName: newMemberData.firstName.trim() || undefined,
          lastName: newMemberData.lastName.trim() || undefined,
          role: 'MEMBER',
          familyId: familyId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create new member')
      }

      const result = await response.json()

      toast.success(`${result.user.name} has been created and added to ${familyName}!`, {
        description: 'They will receive a sign-in link via email.',
      })

      setNewMemberData({ email: '', firstName: '', lastName: '' })
      setShowDialog(false)
      setActiveTab('existing')
      onMemberAdded?.()
      router.refresh()
    } catch (error) {
      console.error('Error creating new member:', error)
      setCreateMemberError(
        error instanceof Error ? error.message : 'Failed to create member'
      )
    } finally {
      setCreatingNewMember(false)
    }
  }, [newMemberData, familyId, familyName, onMemberAdded, router])

  // Handle dialog open
  const handleOpenChange = (open: boolean) => {
    setShowDialog(open)
    if (open) {
      setActiveTab('existing')
      fetchUnassignedMembers()
    } else {
      // Reset state when closing
      setSearchQuery('')
      setAddMemberError(null)
      setCreateMemberError(null)
      setNewMemberData({ email: '', firstName: '', lastName: '' })
      setUnassignedMembers([])
    }
  }

  // Filter unassigned members based on search
  const filteredUnassignedMembers = unassignedMembers.filter(
    (member) =>
      !searchQuery ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Shared content props for both Dialog and Sheet
  const contentProps: AddMemberContentProps = {
    familyName,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    loadingUnassigned,
    addMemberError,
    filteredUnassignedMembers,
    unassignedMembers,
    addingMember,
    addMemberToFamily,
    newMemberData,
    setNewMemberData,
    createMemberError,
    creatingNewMember,
    createNewMember,
    setShowDialog,
  }

  // Mobile: Bottom Sheet
  if (isMobile) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setShowDialog(true)} className="min-h-[44px]">
          <UserPlus className="h-4 w-4 mr-2" />
          Add member
        </Button>
        <Sheet open={showDialog} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="h-[85vh] flex flex-col">
            <SheetHeader className="text-left">
              <SheetTitle>Add Member</SheetTitle>
              <SheetDescription>
                Add to {familyName}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <AddMemberContent {...contentProps} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop: Dialog
  return (
    <Dialog open={showDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="min-h-[44px]">
          <UserPlus className="h-4 w-4 mr-2" />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Member to {familyName}</DialogTitle>
          <DialogDescription>
            Add an existing unassigned member or create a new member for this family.
          </DialogDescription>
        </DialogHeader>
        <AddMemberContent {...contentProps} />
      </DialogContent>
    </Dialog>
  )
}

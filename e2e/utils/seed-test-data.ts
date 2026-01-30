/**
 * Seed test data for E2E tests
 * Creates test users, families, and sample data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test users with known Clerk IDs for testing mode
const TEST_USERS = [
  {
    email: 'admin@test.livingandleaving.local',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'ADMIN' as const,
    clerkId: 'test_admin_001',
  },
  {
    email: 'volunteer@test.livingandleaving.local',
    firstName: 'Test',
    lastName: 'Volunteer',
    role: 'VOLUNTEER' as const,
    clerkId: 'test_volunteer_001',
  },
  {
    email: 'member@test.livingandleaving.local',
    firstName: 'Test',
    lastName: 'Member',
    role: 'MEMBER' as const,
    clerkId: 'test_member_001',
  },
];

// Test families
const TEST_FAMILIES = [
  {
    name: 'Test Family Alpha',
    description: 'First test family for E2E testing',
  },
  {
    name: 'Test Family Beta',
    description: 'Second test family for E2E testing',
  },
];

// Healthcare tag categories and tags
const HEALTHCARE_CATEGORIES = [
  {
    name: 'Medical Conditions',
    tags: ['Cancer', 'Heart Disease', 'Dementia', 'Diabetes', 'Chronic Pain'],
  },
  {
    name: 'Care Needs',
    tags: ['Palliative Care', 'Hospice', 'Home Care', 'Respite Care'],
  },
  {
    name: 'Support Topics',
    tags: ['Grief Support', 'Caregiver Burnout', 'Financial Planning', 'Legal Documents'],
  },
  {
    name: 'Life Stage',
    tags: ['End of Life', 'Terminal Diagnosis', 'Post-Loss', 'Advance Planning'],
  },
];

async function seedTestData() {
  console.log('Starting test data seeding...\n');

  try {
    // Create test users
    console.log('Creating test users...');
    const users: Record<string, { id: string; role: string }> = {};

    for (const userData of TEST_USERS) {
      const existingUser = await prisma.user.findFirst({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`  User ${userData.email} already exists, skipping...`);
        users[userData.role] = { id: existingUser.id, role: userData.role };
        continue;
      }

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          clerkId: userData.clerkId,
          emailVerified: true,
        },
      });

      users[userData.role] = { id: user.id, role: userData.role };
      console.log(`  Created ${userData.role}: ${userData.email}`);
    }

    // Create test families
    console.log('\nCreating test families...');
    const families: string[] = [];

    for (const familyData of TEST_FAMILIES) {
      const existingFamily = await prisma.family.findFirst({
        where: { name: familyData.name },
      });

      if (existingFamily) {
        console.log(`  Family "${familyData.name}" already exists, skipping...`);
        families.push(existingFamily.id);
        continue;
      }

      const family = await prisma.family.create({
        data: {
          name: familyData.name,
          description: familyData.description,
          createdById: users['VOLUNTEER']?.id || users['ADMIN']?.id || '',
        },
      });

      families.push(family.id);
      console.log(`  Created family: ${familyData.name}`);
    }

    // Assign member to first family
    if (users['MEMBER'] && families[0]) {
      await prisma.user.update({
        where: { id: users['MEMBER'].id },
        data: { familyId: families[0] },
      });
      console.log('\n  Assigned member to Test Family Alpha');
    }

    // Create healthcare tags
    console.log('\nCreating healthcare tags...');
    for (const category of HEALTHCARE_CATEGORIES) {
      // Check if category exists
      let categoryRecord = await prisma.category.findFirst({
        where: { name: category.name },
      });

      if (!categoryRecord) {
        categoryRecord = await prisma.category.create({
          data: {
            name: category.name,
            description: `${category.name} category for healthcare content`,
            createdBy: users['ADMIN']?.id || '',
            isSystemCategory: true,
          },
        });
        console.log(`  Created category: ${category.name}`);
      }

      // Create tags for category
      for (const tagName of category.tags) {
        const existingTag = await prisma.tag.findFirst({
          where: { name: tagName },
        });

        if (!existingTag) {
          await prisma.tag.create({
            data: {
              name: tagName,
              categoryId: categoryRecord.id,
              createdBy: users['ADMIN']?.id || '',
              isSystemTag: true,
            },
          });
        }
      }
      console.log(`    Created ${category.tags.length} tags for ${category.name}`);
    }

    // Create sample forums with posts
    console.log('\nCreating sample forums and posts...');
    let forum = await prisma.forum.findFirst({
      where: { title: 'Test Community Forum' },
    });

    if (!forum && users['ADMIN']) {
      forum = await prisma.forum.create({
        data: {
          title: 'Test Community Forum',
          slug: 'test-community-forum',
          description: 'A test forum for E2E testing',
          visibility: 'PUBLIC',
          createdBy: users['ADMIN'].id,
        },
      });
      console.log(`  Created forum: ${forum.title}`);
    }

    // Add forum members
    if (forum) {
      for (const role of ['ADMIN', 'VOLUNTEER', 'MEMBER'] as const) {
        if (users[role]) {
          const existingMembership = await prisma.forumMember.findUnique({
            where: {
              forumId_userId: {
                forumId: forum.id,
                userId: users[role].id,
              },
            },
          });
          if (!existingMembership) {
            await prisma.forumMember.create({
              data: {
                forumId: forum.id,
                userId: users[role].id,
                role: role === 'ADMIN' ? 'MODERATOR' : 'MEMBER',
              },
            });
            console.log(`  Added ${role} as forum member`);
          }
        }
      }

      // Create multiple posts with different types
      const postTypes = [
        { title: 'Welcome to the Test Forum', type: 'DISCUSSION', slug: 'welcome-to-test-forum' },
        { title: 'E2E Test Question Post', type: 'QUESTION', slug: 'e2e-test-question-post' },
        { title: 'E2E Test Resource Post', type: 'RESOURCE', slug: 'e2e-test-resource-post' },
      ];

      for (const postData of postTypes) {
        const existingPost = await prisma.post.findFirst({
          where: { slug: postData.slug },
        });

        if (!existingPost && users['ADMIN']) {
          const post = await prisma.post.create({
            data: {
              title: postData.title,
              slug: postData.slug,
              content: `This is a test ${postData.type.toLowerCase()} post for E2E testing. Feel free to interact with it!`,
              forumId: forum.id,
              authorId: users['ADMIN'].id,
              type: postData.type,
            },
          });
          console.log(`  Created ${postData.type} post: ${post.title}`);

          // Add a sample reply to each post
          if (users['MEMBER']) {
            await prisma.reply.create({
              data: {
                content: `This is a test reply to the ${postData.type.toLowerCase()} post.`,
                postId: post.id,
                authorId: users['MEMBER'].id,
              },
            });
            console.log(`    Added reply to: ${post.title}`);
          }
        }
      }
    }

    // Create multiple sample resources
    console.log('\nCreating sample resources...');
    const resourceTypes = [
      { title: 'Test Resource Document', type: 'DOCUMENT', visibility: 'PUBLIC', status: 'APPROVED' },
      { title: 'Test Link Resource', type: 'LINK', visibility: 'PUBLIC', status: 'APPROVED' },
      { title: 'Test Video Resource', type: 'VIDEO', visibility: 'PUBLIC', status: 'APPROVED' },
      { title: 'Pending Resource for Review', type: 'DOCUMENT', visibility: 'PUBLIC', status: 'PENDING' },
      { title: 'Private Family Resource', type: 'DOCUMENT', visibility: 'PRIVATE', status: 'APPROVED' },
    ];

    for (const resourceData of resourceTypes) {
      const existingResource = await prisma.resource.findFirst({
        where: { title: resourceData.title },
      });

      if (!existingResource && users['ADMIN']) {
        const resource = await prisma.resource.create({
          data: {
            title: resourceData.title,
            description: `A test ${resourceData.type.toLowerCase()} resource for E2E testing`,
            body: '{"blocks":[{"type":"paragraph","data":{"text":"This is test resource content."}}]}',
            resourceType: resourceData.type,
            visibility: resourceData.visibility,
            creator: { connect: { id: users['ADMIN'].id } },
            status: resourceData.status,
            // Link private resources to first family
            ...(resourceData.visibility === 'PRIVATE' && families[0] ? { family: { connect: { id: families[0] } } } : {}),
          },
        });
        console.log(`  Created ${resourceData.type} resource: ${resource.title}`);
      }
    }

    // Create a resource by member (for testing own resources)
    if (users['MEMBER'] && families[0]) {
      const memberResource = await prisma.resource.findFirst({
        where: { title: 'Member Personal Resource' },
      });

      if (!memberResource) {
        await prisma.resource.create({
          data: {
            title: 'Member Personal Resource',
            description: 'A personal resource created by test member',
            body: '{"blocks":[{"type":"paragraph","data":{"text":"Personal notes content."}}]}',
            resourceType: 'DOCUMENT',
            visibility: 'PRIVATE',
            creator: { connect: { id: users['MEMBER'].id } },
            status: 'APPROVED',
            family: { connect: { id: families[0] } },
          },
        });
        console.log(`  Created member's personal resource`);
      }
    }

    console.log('\n✅ Test data seeding complete!\n');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTestData();

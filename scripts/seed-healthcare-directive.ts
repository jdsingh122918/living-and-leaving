/**
 * Seed Living & Leaving Healthcare Directive Template
 *
 * Custom HCD for Keri Winchester's Living & Leaving practice.
 * Includes standard "Naming My Healthcare Agent" plus custom sections.
 *
 * Run with: npx tsx scripts/seed-healthcare-directive.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Standard Yes/No/Undecided options
const YES_NO_UNDECIDED = ['Yes', 'No', 'Undecided'];

// Treatment options with Try option
const YES_NO_TRY_UNDECIDED = ['Yes', 'No', 'Try', 'Undecided'];

// Helper to create agent fields (reused for primary, second alternate, third alternate)
const createAgentFields = (prefix: string, titleSuffix: string = '', isPrimary: boolean = false) => [
  {
    id: `${prefix}-name`,
    type: 'text',
    label: `${titleSuffix ? titleSuffix + ' ' : ''}Name`,
    required: isPrimary,
    placeholder: 'Full name'
  },
  {
    id: `${prefix}-pronouns`,
    type: 'text',
    label: 'Pronouns',
    placeholder: 'e.g., She/her, He/him, They/them'
  },
  {
    id: `${prefix}-relationship`,
    type: 'select',
    label: 'Relationship of My Health Care Agent To Me',
    selectOptions: [
      { value: 'none', label: 'None' },
      { value: 'father', label: 'Father' },
      { value: 'mother', label: 'Mother' },
      { value: 'spouse', label: 'Spouse' },
      { value: 'partner', label: 'Partner' },
      { value: 'sibling', label: 'Sibling' },
      { value: 'child', label: 'Child' },
      { value: 'cousin', label: 'Cousin' },
      { value: 'other-family', label: 'Other Family Member' },
      { value: 'friend', label: 'Friend' },
      { value: 'professional', label: 'Professional' },
      { value: 'self', label: 'Self' }
    ]
  },
  {
    id: `${prefix}-phone`,
    type: 'text',
    label: 'Telephone Number',
    required: isPrimary,
    placeholder: '(555) 555-5555'
  },
  {
    id: `${prefix}-email`,
    type: 'text',
    label: 'Email Address',
    placeholder: 'agent@example.com'
  },
  {
    id: `${prefix}-address`,
    type: 'textarea',
    label: 'Address',
    required: isPrimary,
    placeholder: 'Street Address, City, State, ZIP'
  }
];

// Helper to create treatment directive fields (reused across multiple sections)
const createTreatmentDirectiveFields = (prefix: string) => [
  {
    id: `${prefix}-breathing-machine`,
    type: 'radio',
    label: 'a. A tube placed in my nose or mouth and connected to a machine to breathe for me:',
    options: YES_NO_TRY_UNDECIDED
  },
  {
    id: `${prefix}-feeding-tube`,
    type: 'radio',
    label: 'b. A tube placed in my nose or mouth, or surgically placed in my stomach, to give me food:',
    options: YES_NO_TRY_UNDECIDED
  },
  {
    id: `${prefix}-iv-fluids`,
    type: 'radio',
    label: 'c. A needle or catheter placed in my body to give me water and other fluids:',
    options: YES_NO_TRY_UNDECIDED
  },
  {
    id: `${prefix}-antibiotics`,
    type: 'radio',
    label: 'd. Medications such as antibiotics to fight infections:',
    options: YES_NO_TRY_UNDECIDED
  },
  {
    id: `${prefix}-cpr`,
    type: 'radio',
    label: 'e. Techniques used to bring a person back to life when breathing and pulse have stopped (Cardiopulmonary Resuscitation/CPR):',
    options: YES_NO_UNDECIDED
  },
  {
    id: `${prefix}-transfusions`,
    type: 'radio',
    label: 'f. To receive blood or blood products through a needle placed in my body (transfusions):',
    options: YES_NO_UNDECIDED
  },
  {
    id: `${prefix}-dialysis`,
    type: 'radio',
    label: 'g. My blood cleansed by a machine if my kidneys fail (kidney dialysis):',
    options: YES_NO_UNDECIDED
  },
  {
    id: `${prefix}-surgery`,
    type: 'radio',
    label: 'h. Surgery to help prolong my life/delay my death:',
    options: YES_NO_UNDECIDED
  },
  {
    id: `${prefix}-emergency-treatment`,
    type: 'radio',
    label: 'i. To receive emergency treatment if I am found unconscious in my home:',
    options: YES_NO_UNDECIDED
  }
];

// Form template schema - Living & Leaving Healthcare Directive structure
const LIVING_LEAVING_HCD_SCHEMA = {
  sections: {
    // Section 1: Naming My Healthcare Agent (Standard)
    'healthcare-agent': {
      id: 'healthcare-agent',
      title: 'Naming My Healthcare Agent',
      description: 'A health care agent is someone I elect to make health care decisions in the circumstance I am unable to speak for myself. This could be due to advanced illness, end of life, or a sudden and unexpected accident or health event. A medical provider makes the determination when I lose the capacity to make my own health care decisions. Until that happens, I maintain autonomy over my health care decisions.\n\nA health care agent can be a family member or friend who understands and respects my wishes, values, and goals, is willing to accept the responsibility of this role, and handles stressful situations well. The agent must be over the age of 18 (19 in AL and NE; 21 in CO) and cannot be my current healthcare provider or an employee of that provider unless we are legally related (blood, marriage, or domestic partnership).',
      fields: [
        {
          id: 'agent-intro-display',
          type: 'auto-populate',
          label: 'When I am unable to speak for myself, I appoint the following person(s) to make health care decisions for me:',
          sourceFields: ['agent-name', 'second-alternate-name', 'third-alternate-name']
        },
        ...createAgentFields('agent', 'Primary Healthcare Agent', true)
      ]
    },

    // Section 1b: Second Alternate Agent
    'second-alternate-agent': {
      id: 'second-alternate-agent',
      title: 'Second Alternate Agent',
      description: 'If my primary health care agent is unwilling or unable to serve, I appoint the following person as my second alternate agent.',
      collapsible: true,
      defaultCollapsed: true,
      addButtonLabel: 'Add Second Alternate Agent',
      fields: createAgentFields('second-alternate', 'Second Alternate Agent')
    },

    // Section 1c: Third Alternate Agent
    'third-alternate-agent': {
      id: 'third-alternate-agent',
      title: 'Third Alternate Agent',
      description: 'If my primary and second alternate agents are unwilling or unable to serve, I appoint the following person as my third alternate agent.',
      collapsible: true,
      defaultCollapsed: true,
      addButtonLabel: 'Add Third Alternate Agent',
      fields: createAgentFields('third-alternate', 'Third Alternate Agent')
    },

    // Section 2: Making Decisions About My Care
    'making-decisions': {
      id: 'making-decisions',
      title: 'Making Decisions About My Care',
      description: 'In making decisions about my medical care, the following reflect my views:',
      fields: [
        {
          id: 'prolong-life',
          type: 'radio',
          label: 'a. I want to prolong my life by any means possible:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'control-pain',
          type: 'radio',
          label: 'b. I want to control pain and suffering:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'quality-consistent-values',
          type: 'radio',
          label: 'c. I want a quality of life consistent with my values:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'avoid-burden',
          type: 'radio',
          label: 'd. I want to keep from being a burden to my family/friends:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'save-money',
          type: 'radio',
          label: 'e. I want to save my family\'s money:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'religious-beliefs',
          type: 'radio',
          label: 'f. I want to act according to my religious beliefs:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'other-important-decisions',
          type: 'textarea',
          label: 'Other things that are important to me in making these decisions are:',
          placeholder: 'Enter any other important considerations...'
        }
      ]
    },

    // Section 3: Defining My Quality of Life
    'quality-of-life': {
      id: 'quality-of-life',
      title: 'Defining My Quality of Life',
      description: 'The things that make life worth living:',
      fields: [
        {
          id: 'qol-thinking',
          type: 'radio',
          label: 'a. Thinking well enough to make everyday decisions:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'qol-self-care',
          type: 'radio',
          label: 'b. Being able to take care of myself (bathing, dressing, etc.):',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'qol-communicating',
          type: 'radio',
          label: 'c. Communicating with and relating to others:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'qol-conscious',
          type: 'radio',
          label: 'd. Being conscious and aware of what is happening around me:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'qol-comfortable',
          type: 'radio',
          label: 'e. Being comfortable and free of pain:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'qol-independent',
          type: 'radio',
          label: 'f. Living independently without aid of life-support machines:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'qol-mobile',
          type: 'radio',
          label: 'g. Being able to move about:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'qol-recognize-family',
          type: 'radio',
          label: 'h. Knowing my family and friends:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'qol-explain',
          type: 'textarea',
          label: 'Please explain (optional):',
          placeholder: 'This is a key factor to my quality of life...'
        },
        {
          id: 'qol-activities',
          type: 'textarea',
          label: 'i. Engaging in the following activities:',
          placeholder: 'e.g., travel with ambulatory devices if needed, being able to leave the house and get outside, gardening...'
        },
        {
          id: 'qol-important-because',
          type: 'textarea',
          label: 'These things are important to me because:',
          placeholder: 'Explain why these activities matter to you...'
        }
      ]
    },

    // Section 4: Treatments & Incurable Illness
    'treatments-incurable': {
      id: 'treatments-incurable',
      title: 'Treatments & Incurable Illness',
      description: 'If I have an incurable illness which will most probably cause my death, and I can no longer speak for myself:',
      fields: [
        {
          id: 'incurable-treatment-preference',
          type: 'radio',
          label: 'My treatment preference:',
          options: [
            'I want to try any medical treatment to prolong my life for as long as possible.',
            'I want to try medical treatments for a reasonable period of time, but I will probably want treatments other than those to control pain to be stopped if my condition does not improve.',
            'I only want pain medicine and other treatments to make me comfortable. I do not want to spend my last months having medical treatments that have no hope of curing my illness.',
            'I am undecided at this time.'
          ]
        },
        {
          id: 'incurable-reason',
          type: 'textarea',
          label: 'I chose this approach because:',
          placeholder: 'Explain your reasoning...'
        }
      ]
    },

    // Section 5: Secondary & Curable Illness
    'secondary-curable': {
      id: 'secondary-curable',
      title: 'Secondary & Curable Illness',
      description: 'If I am in the final stages of an illness that cannot be cured, such as cancer, and I also have another illness that can be cured, and I can no longer speak for myself:',
      fields: [
        {
          id: 'curable-medications',
          type: 'radio',
          label: 'I want to receive medications and/or treatments for the illness that can be cured:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'curable-surgery',
          type: 'radio',
          label: 'I want any surgery necessary to treat the illness that can be cured:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'curable-reason',
          type: 'textarea',
          label: 'I made this choice because:',
          placeholder: 'Explain your reasoning...'
        }
      ]
    },

    // Section 6: Additional Treatment Directives (Incurable Illness)
    'treatment-directives-incurable': {
      id: 'treatment-directives-incurable',
      title: 'Additional Treatment Directives',
      description: 'If I am in the final stages of an illness that cannot be cured, and that will most probably cause my death, and I can no longer speak for myself, I want:',
      fields: [
        ...createTreatmentDirectiveFields('incurable'),
        {
          id: 'incurable-hospice',
          type: 'radio',
          label: 'j. To receive hospice care:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'incurable-other',
          type: 'textarea',
          label: 'k. Other choices:',
          placeholder: 'Any additional treatment preferences...'
        }
      ]
    },

    // Section 7: Treatments & Brain Disease
    'treatments-brain': {
      id: 'treatments-brain',
      title: 'Treatments & Brain Disease',
      description: 'If I have a brain disease that cannot be reversed, and I cannot recognize my family and friends, speak meaningfully to them, or live independently:',
      fields: [
        {
          id: 'brain-treatment',
          type: 'radio',
          label: 'I want to receive any medical treatment for the brain disease that could prolong my life:',
          options: [
            'Yes',
            'No, but I want to receive pain medicine and other comfort care',
            'Undecided'
          ]
        },
        {
          id: 'brain-other-illness',
          type: 'radio',
          label: 'I want to be treated for any other illness that could cause my death:',
          options: [
            'Yes',
            'No, but I want to receive pain medicine and other comfort care',
            'Undecided'
          ]
        },
        {
          id: 'brain-reason',
          type: 'textarea',
          label: 'I chose this approach because:',
          placeholder: 'Explain your reasoning...'
        }
      ]
    },

    // Section 8: Additional Treatment Directives (Brain Disease)
    'treatment-directives-brain': {
      id: 'treatment-directives-brain',
      title: 'Additional Treatment Directives (Brain Disease)',
      description: 'If I have a brain disease that cannot be reversed and I cannot recognize my family and friends, speak meaningfully to them, or live independently, I want:',
      fields: [
        ...createTreatmentDirectiveFields('brain'),
        {
          id: 'brain-other',
          type: 'textarea',
          label: 'j. Other choices:',
          placeholder: 'Any additional treatment preferences...'
        }
      ]
    },

    // Section 9: Treatments & Consciousness
    'treatments-consciousness': {
      id: 'treatments-consciousness',
      title: 'Treatments & Consciousness',
      description: 'If I am in a state of permanent unconsciousness and it is highly unlikely that I will ever wake up, I want:',
      fields: [
        ...createTreatmentDirectiveFields('unconscious'),
        {
          id: 'unconscious-other',
          type: 'textarea',
          label: 'j. Other choices:',
          placeholder: 'Any additional treatment preferences...'
        }
      ]
    },

    // Section 10: Pain Medication
    'pain-medication': {
      id: 'pain-medication',
      title: 'Pain Medication',
      description: 'If I have a terminal illness or injury and there is little or no chance that I will ever be well again, and I can no longer speak for myself, I want to receive enough medicine to relieve my pain even though:',
      fields: [
        {
          id: 'pain-less-conscious',
          type: 'radio',
          label: 'The drugs I am taking may cause me to be less conscious and unable to talk:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'pain-reason',
          type: 'textarea',
          label: 'The reason I have made these decisions about pain medications are:',
          placeholder: 'Explain your reasoning...'
        }
      ]
    },

    // Section 11: Organ Donation
    'organ-donation': {
      id: 'organ-donation',
      title: 'Organ Donation & My Death',
      description: 'After I am dead:',
      fields: [
        {
          id: 'donate-organs',
          type: 'radio',
          label: 'I want my organs donated to help save or improve someone else\'s life:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'donate-tissues',
          type: 'radio',
          label: 'I want my tissues donated to help save or improve someone else\'s life:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'donate-eyes',
          type: 'radio',
          label: 'I want my eyes donated to help improve someone else\'s life:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'donate-body',
          type: 'radio',
          label: 'I want my body donated for the purposes of medical education or research (Organ and tissue donation not possible with this option):',
          options: YES_NO_UNDECIDED
        }
      ]
    },

    // Section 12: About My Death
    'about-my-death': {
      id: 'about-my-death',
      title: 'About My Death',
      description: 'Below are my decisions about how I want to die.',
      fields: [
        {
          id: 'death-location',
          type: 'radio',
          label: 'If I have a choice, I want to die:',
          options: [
            'In a hospital',
            'In my home',
            'In a hospice facility',
            'In a nursing home',
            'Undecided at this time',
            'Other'
          ]
        },
        {
          id: 'death-location-reason',
          type: 'textarea',
          label: 'The reasons I want to die there are:',
          placeholder: 'Explain your reasons...'
        },
        {
          id: 'death-people-present',
          type: 'textarea',
          label: 'When I die, I want to have these people with me, if possible:',
          placeholder: 'List the people you want present...'
        },
        {
          id: 'death-preferences',
          type: 'textarea',
          label: 'My other preferences about my death include:',
          placeholder: 'e.g., music, scents, touch preferences, environment...'
        },
        {
          id: 'autopsy-consent',
          type: 'radio',
          label: 'If there is a choice, I would consent to an autopsy of my body if my doctor or my Health Care Agent thinks it is necessary:',
          options: YES_NO_UNDECIDED
        },
        {
          id: 'body-disposition',
          type: 'radio',
          label: 'After my death I want my body to be:',
          options: [
            'Burial',
            'Cremated',
            'Undecided',
            'Other'
          ]
        },
        {
          id: 'body-disposition-explain',
          type: 'textarea',
          label: 'Please explain (optional):',
          placeholder: 'e.g., green burial, cremated with ashes spread...'
        }
      ]
    },

    // Section 13: Member Signature
    'member-signature': {
      id: 'member-signature',
      title: 'Member Signature',
      description: 'I am thinking clearly, I agree with everything that is written in this document, and I have made this document willingly.',
      fields: [
        {
          id: 'member-printed-name',
          type: 'text',
          label: 'My Printed Name',
          required: true,
          placeholder: 'Your full legal name'
        },
        {
          id: 'member-date-of-birth',
          type: 'text',
          label: 'Date of Birth',
          required: true,
          placeholder: 'MM/DD/YYYY'
        },
        {
          id: 'member-address',
          type: 'textarea',
          label: 'Address',
          required: true,
          placeholder: 'Your current address'
        },
        {
          id: 'member-date-signed',
          type: 'text',
          label: 'Date Signed',
          required: true,
          placeholder: 'MM/DD/YYYY'
        },
        {
          id: 'member-signature-box',
          type: 'signature',
          label: 'Signature',
          placeholder: 'Sign here'
        }
      ]
    },

    // Section 14: Witness One
    'witness-one': {
      id: 'witness-one',
      title: 'Witness One',
      description: 'I certify that: (I) I witnessed the signature on this document, (II) I am at least 18 years of age, (III) I am not named as a medical decision maker in this document.',
      fields: [
        {
          id: 'witness1-printed-name',
          type: 'text',
          label: 'Witness Printed Name',
          required: true,
          placeholder: 'Full legal name'
        },
        {
          id: 'witness1-date-signed',
          type: 'text',
          label: 'Date Signed',
          required: true,
          placeholder: 'MM/DD/YYYY'
        },
        {
          id: 'witness1-address',
          type: 'textarea',
          label: 'Address',
          required: true,
          placeholder: 'Witness address'
        },
        {
          id: 'witness1-signature-box',
          type: 'signature',
          label: 'Witness Signature',
          placeholder: 'Sign here'
        }
      ]
    },

    // Section 15: Witness Two
    'witness-two': {
      id: 'witness-two',
      title: 'Witness Two',
      description: 'I certify that: (I) I witnessed the signature on this document, (II) I am at least 18 years of age, (III) I am not named as a medical decision maker in this document.',
      fields: [
        {
          id: 'witness2-printed-name',
          type: 'text',
          label: 'Witness Printed Name',
          required: true,
          placeholder: 'Full legal name'
        },
        {
          id: 'witness2-date-signed',
          type: 'text',
          label: 'Date Signed',
          required: true,
          placeholder: 'MM/DD/YYYY'
        },
        {
          id: 'witness2-address',
          type: 'textarea',
          label: 'Address',
          required: true,
          placeholder: 'Witness address'
        },
        {
          id: 'witness2-signature-box',
          type: 'signature',
          label: 'Witness Signature',
          placeholder: 'Sign here'
        }
      ]
    }
  }
};

async function seedLivingLeavingHCD() {
  console.log('Starting Living & Leaving Healthcare Directive template seed...\n');

  try {
    // Find or create a system admin user to be the creator
    let systemUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'system@villages.com' },
          { email: 'keri@livingandleaving.com' },
          { role: 'ADMIN' }
        ]
      }
    });

    if (!systemUser) {
      console.log('No admin user found. Please create an admin user first.');
      console.log('Run: npx tsx scripts/initialize-database.ts');
      process.exit(1);
    }

    console.log(`Using admin user: ${systemUser.email}`);

    // Delete existing template if it exists (to allow re-seeding)
    const existingTemplate = await prisma.resource.findFirst({
      where: {
        title: 'Living & Leaving Healthcare Directive',
        tags: { hasEvery: ['advance-directives', 'living-leaving'] },
        isSystemGenerated: true
      }
    });

    if (existingTemplate) {
      console.log('\nDeleting existing Living & Leaving Healthcare Directive template...');
      await prisma.resource.delete({
        where: { id: existingTemplate.id }
      });
      console.log('Existing template deleted.');
    }

    // Create the Healthcare Directive template
    const template = await prisma.resource.create({
      data: {
        title: 'Living & Leaving Healthcare Directive',
        description: 'A comprehensive Healthcare Directive form for Living & Leaving clients to document healthcare wishes, appoint a healthcare agent, and specify treatment preferences for end-of-life care.',
        body: 'Living & Leaving Healthcare Directive form template - see externalMeta.formSchema for form structure',
        resourceType: 'TOOL',
        visibility: 'PRIVATE',
        tags: ['advance-directives', 'healthcare', 'legal-documents', 'end-of-life', 'living-leaving'],
        targetAudience: ['MEMBER', 'VOLUNTEER', 'ADMIN'],
        isSystemGenerated: true,
        createdBy: systemUser.id,
        externalMeta: {
          isTemplate: true,
          systemGenerated: true,
          templateType: 'healthcare-directive',
          variant: 'living-leaving',
          version: '2.0.0',
          lastUpdated: new Date().toISOString(),
          sectionCount: Object.keys(LIVING_LEAVING_HCD_SCHEMA.sections).length,
          source: 'Living & Leaving Custom Healthcare Directive',
          formSchema: LIVING_LEAVING_HCD_SCHEMA
        }
      }
    });

    console.log('\nLiving & Leaving Healthcare Directive template created successfully!');
    console.log(`   ID: ${template.id}`);
    console.log(`   Title: ${template.title}`);
    console.log(`   Sections: ${Object.keys(LIVING_LEAVING_HCD_SCHEMA.sections).length}`);
    console.log(`   Tags: ${template.tags.join(', ')}`);
    console.log('\nSections included:');
    Object.values(LIVING_LEAVING_HCD_SCHEMA.sections).forEach((section: any, index: number) => {
      console.log(`   ${index + 1}. ${section.title}`);
    });
    console.log('\nThe template is now available in the Resources section.');

    return template;

  } catch (error) {
    console.error('Error seeding Living & Leaving Healthcare Directive template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedLivingLeavingHCD()
  .then(() => {
    console.log('\nSeed completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSeed failed:', error);
    process.exit(1);
  });

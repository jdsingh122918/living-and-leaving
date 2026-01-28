/**
 * Living & Leaving Healthcare Directive Seed Script
 *
 * Creates the Living & Leaving Healthcare Directive form template with 15 sections:
 * 1. HCA Addendum
 * 2. My Values (0-10 ratings)
 * 3. Cardiopulmonary Resuscitation
 * 4. Life-Sustaining Treatment
 * 5. Hydration & Nutrition
 * 6. Healthcare Wishes (12 questions)
 * 7. Care and Treatment Thresholds (4 scenarios)
 * 8. Death with Dignity (MAiD/VSED)
 * 9. Dementia Care (5 questions)
 * 10. Dementia Care Considerations (5 scenarios)
 * 11. After Death Care
 *
 * Plus the standard "Naming My Healthcare Agent" section.
 *
 * Run with: npx tsx scripts/seed-healthcare-directive.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// 0-10 rating options for My Values section
const RATING_OPTIONS = [
  { value: '0', label: '0 - Not Important At All' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5 - Somewhat Important' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10 - Extremely Important' }
];

// Care and Treatment Threshold options (used for 4 scenarios)
const TREATMENT_THRESHOLD_OPTIONS = [
  'Full treatment - I want all available treatments to extend my life',
  'Limited treatment - I want treatment only if there is a reasonable chance of recovery',
  'Comfort care only - I want to focus on comfort and quality of life, not extending life',
  'Trial period - Try treatments for a limited time, then reassess',
  'Let my healthcare agent decide based on the specific situation'
];

// Dementia Care Considerations options (used for 5 scenarios)
const DEMENTIA_CARE_OPTIONS = [
  'Yes, I would want this intervention',
  'No, I would not want this intervention',
  'I would want a trial period to see if it helps',
  'I want my healthcare agent to decide'
];

// Healthcare Directive Form Schema
const HEALTHCARE_DIRECTIVE_FORM_SCHEMA = {
  sections: {
    // Standard Section: Naming My Healthcare Agent (same as doula-villages)
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

    // Second Alternate Agent (Collapsible)
    'second-alternate-agent': {
      id: 'second-alternate-agent',
      title: 'Second Alternate Agent',
      description: 'If my primary health care agent is unwilling or unable to serve, I appoint the following person as my second alternate agent.',
      collapsible: true,
      defaultCollapsed: true,
      addButtonLabel: 'Add Second Alternate Agent',
      fields: createAgentFields('second-alternate', 'Second Alternate Agent')
    },

    // Third Alternate Agent (Collapsible)
    'third-alternate-agent': {
      id: 'third-alternate-agent',
      title: 'Third Alternate Agent',
      description: 'If my primary and second alternate agents are unwilling or unable to serve, I appoint the following person as my third alternate agent.',
      collapsible: true,
      defaultCollapsed: true,
      addButtonLabel: 'Add Third Alternate Agent',
      fields: createAgentFields('third-alternate', 'Third Alternate Agent')
    },

    // Step 1: Health Care Agent (HCA) Addendum
    'hca-addendum': {
      id: 'hca-addendum',
      title: 'Health Care Agent Addendum',
      description: 'This addendum provides additional guidance and authority to your healthcare agent. By signing below, you acknowledge that your healthcare agent has the authority to make decisions on your behalf according to your wishes expressed in this document.',
      fields: [
        {
          id: 'hca-addendum-info',
          type: 'info',
          label: 'Important Information',
          content: 'Your healthcare agent should be someone who:\n\n• Knows your values and wishes regarding medical care\n• Is willing to speak on your behalf\n• Can handle the emotional responsibility of making difficult decisions\n• Will follow your instructions even if they disagree personally\n• Is available when needed and can communicate with your medical team'
        },
        {
          id: 'hca-addendum-acknowledgment',
          type: 'checkbox',
          label: 'I acknowledge and agree:',
          options: [
            'I have discussed my wishes with my healthcare agent(s)',
            'My healthcare agent(s) understand and will follow my instructions',
            'I authorize my healthcare agent to access my medical records',
            'I authorize my healthcare agent to make decisions about my care when I cannot'
          ],
          value: []
        },
        {
          id: 'hca-addendum-signature',
          type: 'signature',
          label: 'eSignature Acknowledgment',
          required: true,
          placeholder: 'Sign to acknowledge'
        },
        {
          id: 'hca-addendum-date',
          type: 'text',
          label: 'Date',
          placeholder: 'MM/DD/YYYY'
        }
      ]
    },

    // Step 2: My Values
    'my-values': {
      id: 'my-values',
      title: 'My Values',
      description: 'Please rate each of the following on a scale of 0-10, with 0 being "not important at all" and 10 being "extremely important." These ratings help your healthcare agent understand what matters most to you.',
      fields: [
        {
          id: 'value-independence',
          type: 'select',
          label: 'Being independent and able to care for myself',
          selectOptions: RATING_OPTIONS
        },
        {
          id: 'value-mental-clarity',
          type: 'select',
          label: 'Having mental clarity and being able to think clearly',
          selectOptions: RATING_OPTIONS
        },
        {
          id: 'value-communication',
          type: 'select',
          label: 'Being able to communicate with loved ones',
          selectOptions: RATING_OPTIONS
        },
        {
          id: 'value-pain-free',
          type: 'select',
          label: 'Being free from pain and discomfort',
          selectOptions: RATING_OPTIONS
        },
        {
          id: 'value-dignity',
          type: 'select',
          label: 'Maintaining my dignity and privacy',
          selectOptions: RATING_OPTIONS
        },
        {
          id: 'value-spirituality',
          type: 'select',
          label: 'Being able to practice my spiritual or religious beliefs',
          selectOptions: RATING_OPTIONS
        },
        {
          id: 'value-family-time',
          type: 'select',
          label: 'Spending time with family and friends',
          selectOptions: RATING_OPTIONS
        },
        {
          id: 'value-home',
          type: 'select',
          label: 'Staying in my home or a familiar environment',
          selectOptions: RATING_OPTIONS
        },
        {
          id: 'value-quality-over-quantity',
          type: 'select',
          label: 'Quality of life over length of life',
          selectOptions: RATING_OPTIONS
        }
      ]
    },

    // Step 3: Cardiopulmonary Resuscitation
    'cpr-preferences': {
      id: 'cpr-preferences',
      title: 'Cardiopulmonary Resuscitation (CPR)',
      description: 'CPR is an emergency procedure used when the heart stops beating. It may include chest compressions, electric shocks (defibrillation), and breathing tubes. Please indicate your preferences.',
      fields: [
        {
          id: 'cpr-decision',
          type: 'radio',
          label: 'If my heart stops beating, I want:',
          options: [
            'Attempt CPR - I want healthcare providers to try to restart my heart and restore breathing, understanding that this may include chest compressions, electric shocks, breathing tubes, and medications.',
            'Do Not Attempt CPR (DNR) - I do not want CPR attempted. I understand this means I will be allowed to die naturally if my heart stops.'
          ]
        },
        {
          id: 'cpr-additional-instructions',
          type: 'textarea',
          label: 'Additional instructions or conditions for CPR (optional):',
          placeholder: 'Enter any specific conditions or instructions regarding CPR...'
        }
      ]
    },

    // Step 4: Life-Sustaining Treatment
    'life-sustaining-treatment': {
      id: 'life-sustaining-treatment',
      title: 'Life-Sustaining Treatment',
      description: 'Life-sustaining treatments are medical interventions that can prolong life when vital organs fail. These may include mechanical ventilation (breathing machines), dialysis, and other intensive interventions.',
      fields: [
        {
          id: 'lst-decision',
          type: 'radio',
          label: 'My preferences for life-sustaining treatment:',
          options: [
            'Full Treatment - I want all available life-sustaining treatments to keep me alive as long as possible.',
            'Limited Treatment - I want life-sustaining treatment only if there is a reasonable expectation of recovery. If my condition becomes irreversible, focus on comfort.',
            'Comfort Care Only - I do not want life-sustaining treatments. Focus on keeping me comfortable and managing pain.'
          ]
        },
        {
          id: 'lst-additional-instructions',
          type: 'textarea',
          label: 'Additional instructions about life-sustaining treatment (optional):',
          placeholder: 'Enter any specific conditions or instructions...'
        }
      ]
    },

    // Step 5: Hydration & Nutrition
    'hydration-nutrition': {
      id: 'hydration-nutrition',
      title: 'Hydration and Nutrition',
      description: 'When a person cannot eat or drink by mouth, fluids and nutrition can be provided through tubes (feeding tubes, IV fluids). Please indicate your preferences.',
      fields: [
        {
          id: 'hn-decision',
          type: 'radio',
          label: 'My preferences for artificial hydration and nutrition:',
          options: [
            'I want artificial hydration and nutrition provided indefinitely to keep me alive.',
            'I want a trial period of artificial hydration and nutrition. If there is no improvement, it may be discontinued.',
            'I want artificial hydration and nutrition only for comfort (e.g., to relieve thirst or hunger sensations).',
            'I do not want artificial hydration or nutrition. I prefer to allow natural dying process.'
          ]
        }
      ]
    },

    // Step 6: Healthcare Wishes (12 questions)
    'healthcare-wishes': {
      id: 'healthcare-wishes',
      title: 'Healthcare Wishes',
      description: 'Please answer the following questions to help your healthcare agent understand your specific wishes.',
      fields: [
        {
          id: 'hw-1-pain-management',
          type: 'textarea',
          label: '1. What are your wishes regarding pain management?',
          placeholder: 'Describe your preferences for pain medication and comfort care...'
        },
        {
          id: 'hw-2-quality-of-life',
          type: 'textarea',
          label: '2. What does quality of life mean to you?',
          placeholder: 'Describe what makes life meaningful to you...'
        },
        {
          id: 'hw-3-unacceptable-conditions',
          type: 'textarea',
          label: '3. Are there any conditions that would be unacceptable to you?',
          placeholder: 'Describe any conditions you would find unacceptable...'
        },
        {
          id: 'hw-4-religious-spiritual',
          type: 'textarea',
          label: '4. Do you have any religious or spiritual beliefs that should guide your care?',
          placeholder: 'Describe any religious or spiritual considerations...'
        },
        {
          id: 'hw-5-who-present',
          type: 'textarea',
          label: '5. Who would you like to be present during your final days?',
          placeholder: 'List the people you want at your bedside...'
        },
        {
          id: 'hw-6-where-die',
          type: 'radio',
          label: '6. Where would you prefer to die if possible?',
          options: [
            'At home',
            'In a hospital',
            'In a hospice facility',
            'Wherever I can receive the best care',
            'I have no preference'
          ]
        },
        {
          id: 'hw-7-hospice',
          type: 'radio',
          label: '7. Would you want hospice care if you were terminally ill?',
          options: [
            'Yes, I would want hospice care',
            'No, I would not want hospice care',
            'I would want my healthcare agent to decide'
          ]
        },
        {
          id: 'hw-8-mental-health',
          type: 'textarea',
          label: '8. Do you have any mental health conditions that should be considered?',
          placeholder: 'Describe any relevant mental health history...'
        },
        {
          id: 'hw-9-allergies',
          type: 'textarea',
          label: '9. Do you have any allergies or adverse reactions to medications?',
          placeholder: 'List any known allergies...'
        },
        {
          id: 'hw-10-current-medications',
          type: 'textarea',
          label: '10. Are you currently taking any medications that should be known?',
          placeholder: 'List current medications...'
        },
        {
          id: 'hw-11-experimental-treatment',
          type: 'radio',
          label: '11. Would you want to participate in experimental treatments?',
          options: [
            'Yes, I would consider experimental treatments',
            'No, I would not want experimental treatments',
            'Only if conventional treatments have failed',
            'I want my healthcare agent to decide'
          ]
        },
        {
          id: 'hw-12-additional-wishes',
          type: 'textarea',
          label: '12. Any additional healthcare wishes not covered above?',
          placeholder: 'Enter any additional wishes or instructions...'
        }
      ]
    },

    // Step 7: Care and Treatment Thresholds
    'treatment-thresholds': {
      id: 'treatment-thresholds',
      title: 'Care and Treatment Thresholds',
      description: 'The following scenarios describe situations where you might need to make decisions about treatment. For each scenario, please indicate which treatments you would or would not want.',
      fields: [
        {
          id: 'threshold-scenario-1-label',
          type: 'info',
          label: 'Scenario 1: Terminal illness with less than 6 months to live',
          content: 'If I am diagnosed with a terminal illness and my doctors believe I have less than 6 months to live:'
        },
        {
          id: 'threshold-scenario-1',
          type: 'checkbox',
          label: 'I would want (select all that apply):',
          options: TREATMENT_THRESHOLD_OPTIONS,
          value: []
        },
        {
          id: 'threshold-scenario-2-label',
          type: 'info',
          label: 'Scenario 2: Permanent unconsciousness',
          content: 'If I am in a persistent vegetative state or permanent coma with no reasonable expectation of recovery:'
        },
        {
          id: 'threshold-scenario-2',
          type: 'checkbox',
          label: 'I would want (select all that apply):',
          options: TREATMENT_THRESHOLD_OPTIONS,
          value: []
        },
        {
          id: 'threshold-scenario-3-label',
          type: 'info',
          label: 'Scenario 3: Advanced dementia',
          content: 'If I have advanced dementia and can no longer recognize family members or communicate:'
        },
        {
          id: 'threshold-scenario-3',
          type: 'checkbox',
          label: 'I would want (select all that apply):',
          options: TREATMENT_THRESHOLD_OPTIONS,
          value: []
        },
        {
          id: 'threshold-scenario-4-label',
          type: 'info',
          label: 'Scenario 4: Severe brain injury',
          content: 'If I have a severe brain injury and will require total care for the rest of my life:'
        },
        {
          id: 'threshold-scenario-4',
          type: 'checkbox',
          label: 'I would want (select all that apply):',
          options: TREATMENT_THRESHOLD_OPTIONS,
          value: []
        }
      ]
    },

    // Step 8: Death with Dignity (MAiD/VSED)
    'death-with-dignity': {
      id: 'death-with-dignity',
      title: 'Death with Dignity Options',
      description: 'Some states allow medical aid in dying (MAiD) for terminally ill patients. Voluntarily stopping eating and drinking (VSED) is another option available in all states. Please indicate your preferences.',
      fields: [
        {
          id: 'maid-info',
          type: 'info',
          label: 'Medical Aid in Dying (MAiD)',
          content: 'Medical Aid in Dying allows a terminally ill adult to request medication to end their life. This is currently legal in some states (California, Colorado, District of Columbia, Hawaii, Maine, Montana, New Jersey, New Mexico, Oregon, Vermont, Washington). Requirements typically include terminal diagnosis with 6 months or less to live, mental competence, and multiple requests.'
        },
        {
          id: 'maid-preference',
          type: 'checkbox',
          label: 'Medical Aid in Dying preferences:',
          options: [
            'I would consider Medical Aid in Dying if I am terminally ill and it is legal in my state',
            'I would NOT want Medical Aid in Dying under any circumstances',
            'I want my healthcare agent to have information about MAiD but I am undecided'
          ],
          value: []
        },
        {
          id: 'maid-additional',
          type: 'textarea',
          label: 'Additional thoughts about Medical Aid in Dying (optional):',
          placeholder: 'Enter any additional thoughts or conditions...'
        },
        {
          id: 'vsed-info',
          type: 'info',
          label: 'Voluntarily Stopping Eating and Drinking (VSED)',
          content: 'VSED is a legal option in all states where a person chooses to stop eating and drinking to hasten death. This typically takes 1-3 weeks and requires good comfort care. VSED can be initiated while a person still has decision-making capacity.'
        },
        {
          id: 'vsed-preference',
          type: 'checkbox',
          label: 'VSED preferences:',
          options: [
            'I would consider VSED if I have a terminal illness or unbearable condition',
            'I would NOT want VSED under any circumstances',
            'I want my healthcare agent to have information about VSED but I am undecided'
          ],
          value: []
        },
        {
          id: 'vsed-additional',
          type: 'textarea',
          label: 'Additional thoughts about VSED (optional):',
          placeholder: 'Enter any additional thoughts or conditions...'
        }
      ]
    },

    // Step 9: Dementia Care
    'dementia-care': {
      id: 'dementia-care',
      title: 'Dementia Care',
      description: 'If you were to develop dementia, please answer the following questions to help guide your care.',
      fields: [
        {
          id: 'dementia-1-living-situation',
          type: 'textarea',
          label: '1. Where would you want to live if you developed dementia?',
          placeholder: 'Describe your preferred living situation (home, memory care facility, with family, etc.)...'
        },
        {
          id: 'dementia-2-daily-activities',
          type: 'textarea',
          label: '2. What daily activities would be most important to maintain?',
          placeholder: 'Describe activities that bring you joy or meaning...'
        },
        {
          id: 'dementia-3-safety-vs-freedom',
          type: 'textarea',
          label: '3. How should safety concerns be balanced with personal freedom?',
          placeholder: 'Describe your preferences regarding safety measures vs. independence...'
        },
        {
          id: 'dementia-4-who-decides',
          type: 'textarea',
          label: '4. Who should make decisions about your care if you cannot?',
          placeholder: 'Describe who should be involved in care decisions...'
        },
        {
          id: 'dementia-5-end-of-life',
          type: 'textarea',
          label: '5. What are your end-of-life wishes if you have advanced dementia?',
          placeholder: 'Describe your wishes for end-of-life care with dementia...'
        }
      ]
    },

    // Step 10: Dementia Care Considerations
    'dementia-considerations': {
      id: 'dementia-considerations',
      title: 'Dementia Care Considerations',
      description: 'For each of the following scenarios, please indicate whether you would want the intervention if you had moderate to severe dementia.',
      fields: [
        {
          id: 'dementia-scenario-1-label',
          type: 'info',
          label: 'Scenario 1: Hospitalization for infection',
          content: 'If I developed a serious infection (like pneumonia) and needed hospitalization:'
        },
        {
          id: 'dementia-scenario-1',
          type: 'radio',
          label: 'I would want:',
          options: DEMENTIA_CARE_OPTIONS
        },
        {
          id: 'dementia-scenario-2-label',
          type: 'info',
          label: 'Scenario 2: Feeding tube',
          content: 'If I could no longer eat or drink safely and a feeding tube was recommended:'
        },
        {
          id: 'dementia-scenario-2',
          type: 'radio',
          label: 'I would want:',
          options: DEMENTIA_CARE_OPTIONS
        },
        {
          id: 'dementia-scenario-3-label',
          type: 'info',
          label: 'Scenario 3: Surgery for broken hip',
          content: 'If I broke my hip and surgery was recommended:'
        },
        {
          id: 'dementia-scenario-3',
          type: 'radio',
          label: 'I would want:',
          options: DEMENTIA_CARE_OPTIONS
        },
        {
          id: 'dementia-scenario-4-label',
          type: 'info',
          label: 'Scenario 4: Dialysis',
          content: 'If my kidneys failed and dialysis was needed to survive:'
        },
        {
          id: 'dementia-scenario-4',
          type: 'radio',
          label: 'I would want:',
          options: DEMENTIA_CARE_OPTIONS
        },
        {
          id: 'dementia-scenario-5-label',
          type: 'info',
          label: 'Scenario 5: Antibiotics for comfort',
          content: 'If I had an infection that could be treated with antibiotics but would not change my overall condition:'
        },
        {
          id: 'dementia-scenario-5',
          type: 'radio',
          label: 'I would want:',
          options: DEMENTIA_CARE_OPTIONS
        }
      ]
    },

    // Step 11: After Death Care
    'after-death-care': {
      id: 'after-death-care',
      title: 'After Death Care',
      description: 'Please indicate your preferences for what happens after you pass away.',
      fields: [
        {
          id: 'body-disposition',
          type: 'radio',
          label: 'What would you like done with your body?',
          options: [
            'Traditional burial',
            'Cremation',
            'Green/natural burial',
            'Donation to medical science',
            'I want my healthcare agent/family to decide'
          ]
        },
        {
          id: 'organ-donation',
          type: 'radio',
          label: 'Do you want to be an organ and tissue donor?',
          options: [
            'Yes, I want to donate any organs and tissues that could help others',
            'Yes, but only certain organs/tissues (specify below)',
            'No, I do not want to donate organs or tissues',
            'I want my healthcare agent/family to decide'
          ]
        },
        {
          id: 'organ-donation-specifics',
          type: 'textarea',
          label: 'If you selected specific organs/tissues, please specify:',
          placeholder: 'List specific organs or tissues you wish to donate...'
        },
        {
          id: 'autopsy',
          type: 'radio',
          label: 'What are your wishes regarding autopsy?',
          options: [
            'I consent to autopsy if medically or legally needed',
            'I do not want an autopsy unless required by law',
            'I want my healthcare agent/family to decide'
          ]
        },
        {
          id: 'funeral-wishes',
          type: 'radio',
          label: 'What type of memorial service would you prefer?',
          options: [
            'Traditional religious funeral service',
            'Non-religious celebration of life',
            'Private family gathering only',
            'No memorial service',
            'I want my family to decide what is best for them'
          ]
        },
        {
          id: 'after-death-additional',
          type: 'textarea',
          label: 'Any additional wishes or instructions regarding after-death care:',
          placeholder: 'Include any specific wishes about funeral home, readings, music, flowers, donations, etc...'
        }
      ]
    },

    // Member Signature Section
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
          id: 'member-signature-type',
          type: 'radio',
          label: 'Signature Method',
          options: [
            'eSignature (Anvil)',
            'In-Person Signature'
          ]
        },
        {
          id: 'member-signature-box',
          type: 'signature',
          label: 'Signature',
          placeholder: 'Sign here'
        },
        {
          id: 'alternate-signer-name',
          type: 'text',
          label: 'If I cannot sign my name, the person who signed on my behalf:',
          placeholder: 'Full name of person who signed for you (if applicable)'
        }
      ]
    },

    // Witness One
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
          id: 'witness1-signature-type',
          type: 'radio',
          label: 'Signature Method',
          options: [
            'eSignature (Anvil)',
            'In-Person Signature'
          ]
        },
        {
          id: 'witness1-signature-box',
          type: 'signature',
          label: 'Witness Signature',
          placeholder: 'Sign here'
        }
      ]
    },

    // Witness Two
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
          id: 'witness2-signature-type',
          type: 'radio',
          label: 'Signature Method',
          options: [
            'eSignature (Anvil)',
            'In-Person Signature'
          ]
        },
        {
          id: 'witness2-signature-box',
          type: 'signature',
          label: 'Witness Signature',
          placeholder: 'Sign here'
        }
      ]
    },

    // Notary (Optional)
    'notary-section': {
      id: 'notary-section',
      title: 'Sign Before a Notary (Optional)',
      description: 'Some states require or recommend notarization. Check your state requirements.',
      fields: [
        {
          id: 'notary-printed-name',
          type: 'text',
          label: 'Notary Printed Name',
          placeholder: 'Full legal name'
        },
        {
          id: 'notary-date-signed',
          type: 'text',
          label: 'Date Signed',
          placeholder: 'MM/DD/YYYY'
        },
        {
          id: 'notary-signature-box',
          type: 'signature',
          label: 'Notary Signature',
          placeholder: 'Sign here'
        },
        {
          id: 'notary-commission-expiration',
          type: 'text',
          label: 'Commission Expiration Date',
          placeholder: 'MM/DD/YYYY'
        }
      ]
    }
  }
};

async function seedHealthcareDirective() {
  console.log('Starting Living & Leaving Healthcare Directive template seed...\n');

  try {
    // Find a system admin user to be the creator
    const systemUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'system@villages.com' },
          { role: 'ADMIN' }
        ]
      }
    });

    if (!systemUser) {
      console.log('No admin user found. Please create an admin user first.');
      console.log('Run: npx tsx scripts/initialize-database.ts');
      process.exit(1);
    }

    console.log(`Using admin user: ${systemUser.email || systemUser.firstName}`);

    // Delete existing template if it exists (to allow re-seeding)
    const existingTemplate = await prisma.resource.findFirst({
      where: {
        title: 'Living & Leaving Healthcare Directive',
        tags: { has: 'living-leaving' },
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

    // Create the Living & Leaving Healthcare Directive template
    const template = await prisma.resource.create({
      data: {
        title: 'Living & Leaving Healthcare Directive',
        description: 'A comprehensive form to document your healthcare wishes, appoint a healthcare agent, and specify your treatment preferences for end-of-life care including dementia care considerations and death with dignity options.',
        body: 'Living & Leaving Healthcare Directive form template - see externalMeta.formSchema for form structure',
        resourceType: 'TOOL',
        visibility: 'PUBLIC',
        tags: ['advance-directives', 'healthcare', 'legal-documents', 'end-of-life', 'living-leaving'],
        targetAudience: ['MEMBER', 'DOULA', 'ADMIN'],
        status: 'APPROVED',
        isVerified: true,
        hasCuration: false,
        hasRatings: true,
        hasSharing: true,
        isSystemGenerated: true,
        createdBy: systemUser.id,
        externalMeta: {
          isTemplate: true,
          systemGenerated: true,
          templateType: 'healthcare-directive',
          version: '1.0.0',
          brand: 'living-leaving',
          lastUpdated: new Date().toISOString(),
          sectionCount: Object.keys(HEALTHCARE_DIRECTIVE_FORM_SCHEMA.sections).length,
          source: 'Living & Leaving Healthcare Directive Form',
          formSchema: HEALTHCARE_DIRECTIVE_FORM_SCHEMA
        }
      }
    });

    console.log('\n✅ Living & Leaving Healthcare Directive template created successfully!');
    console.log(`   ID: ${template.id}`);
    console.log(`   Title: ${template.title}`);
    console.log(`   Sections: ${Object.keys(HEALTHCARE_DIRECTIVE_FORM_SCHEMA.sections).length}`);
    console.log(`   Tags: ${template.tags.join(', ')}`);
    console.log('\n📋 Sections included:');
    Object.values(HEALTHCARE_DIRECTIVE_FORM_SCHEMA.sections).forEach((section, index) => {
      console.log(`   ${index + 1}. ${section.title}`);
    });
    console.log('\nThe template is now available in the Resources section.');
    console.log('Admins can share this with family members to complete their Living & Leaving Healthcare Directive.');

    return template;

  } catch (error) {
    console.error('Error seeding Healthcare Directive template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedHealthcareDirective()
  .then(() => {
    console.log('\nSeed completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSeed failed:', error);
    process.exit(1);
  });

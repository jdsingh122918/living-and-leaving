/**
 * Comprehensive Healthcare Service Tags Configuration
 *
 * This file defines the predefined system tags and categories that are automatically
 * available in the platform. These tags help organize
 * and categorize healthcare services, resources, and care management activities.
 */

export interface HealthcareCategory {
  name: string;
  description: string;
  color: string;
  icon: string;
  tags: string[];
}

export const HEALTHCARE_CATEGORIES: HealthcareCategory[] = [
  {
    name: "Basic Needs & Daily Living",
    description: "Essential daily living support, finances, and basic needs",
    color: "#5B7555", // Sage Green (Primary)
    icon: "🛡️",
    tags: [
      "Basic Human Needs (Food, Clothing, Housing, Goods)",
      "Employment",
      "Finances",
      "Insurance",
      "Medical Assistance",
      "Nutrition & Feeding",
      "Resource finding tools",
      "Transportation",
    ],
  },
  {
    name: "Education",
    description: "Educational services and developmental support",
    color: "#6B8E6B", // Moss Green
    icon: "📚",
    tags: ["Early Intervention/Developmental Services", "Education"],
  },
  {
    name: "Home & Community-based Care",
    description: "Home healthcare services and community-based support",
    color: "#3D7A5A", // Forest Green
    icon: "🏠",
    tags: [
      "Case Management/Care Coordination",
      "Home Healthcare",
      "Home Modifications & Accessibility",
      "Respite Care",
    ],
  },
  {
    name: "Legal & Advocacy",
    description: "Legal services, advocacy, and protective services",
    color: "#2F4F2F", // Dark Olive
    icon: "⚖️",
    tags: ["Adoption, Foster Care & CYF", "Advocacy", "Legal Aid"],
  },
  {
    name: "Medical & Healthcare Services",
    description: "Core medical services and healthcare professionals",
    color: "#2D5A4A", // Deep Teal-Green
    icon: "🏥",
    tags: [
      "Disabilities",
      "Diagnosis/Disease Specific resources",
      "Doctors/Physicians",
      "Emergency Care",
      "Hospital & Medical Facilities",
      "Medical Decision-Making",
      "Medications/Pharmacy",
      "Medical Procedures, Tests & Surgery",
      "Pain & Symptom Management",
      "Palliative & Hospice Care",
      "Rehabilitation Therapy",
      "Wound Care",
    ],
  },
  {
    name: "Medical Equipment & Supportive Technology",
    description: "Medical devices, adaptive equipment, and technology",
    color: "#4A6741", // Hunter Green
    icon: "🔧",
    tags: [
      "Adaptive Care Equipment & Technology",
      "Communication Devices",
      "Medical Supplies & Equipment",
    ],
  },
  {
    name: "Mental Health & Supportive Programs",
    description: "Mental health, behavioral support, and therapeutic programs",
    color: "#8FBC8F", // Dark Sea Green
    icon: "🧠",
    tags: [
      "Behavioral Support",
      "Camps",
      "Crisis Care",
      "Grief/Bereavement Support",
      "Mental Health & Wellness",
      "Non-profits (multiple services)",
      "Psychosocial Care & Creative Arts Therapy",
      "Recreation",
      "Sibling Support",
      "Support Groups",
      "Wish Granting Organizations",
    ],
  },
];

/**
 * Flattened list of all healthcare tags for easy access
 */
export const ALL_HEALTHCARE_TAGS = HEALTHCARE_CATEGORIES.flatMap((category) =>
  category.tags.map((tag) => ({
    name: tag,
    category: category.name,
    description: `Healthcare service related to ${category.description.toLowerCase()}`,
    color: category.color,
  })),
);

/**
 * Color palette for healthcare categories - Brand Color Palette
 */
export const HEALTHCARE_COLORS = {
  BASIC_NEEDS: "#5B7555", // Sage Green (Primary)
  EDUCATION: "#6B8E6B", // Moss Green
  HOME_CARE: "#3D7A5A", // Forest Green
  LEGAL: "#2F4F2F", // Dark Olive
  MEDICAL: "#2D5A4A", // Deep Teal-Green
  EQUIPMENT: "#4A6741", // Hunter Green
  MENTAL_HEALTH: "#8FBC8F", // Dark Sea Green
} as const;

/**
 * Icons for healthcare categories
 */
export const HEALTHCARE_ICONS = {
  BASIC_NEEDS: "🛡️",
  EDUCATION: "📚",
  HOME_CARE: "🏠",
  LEGAL: "⚖️",
  MEDICAL: "🏥",
  EQUIPMENT: "🔧",
  MENTAL_HEALTH: "🧠",
} as const;

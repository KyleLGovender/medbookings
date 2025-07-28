import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data
  try {
    await prisma.requirementType.deleteMany();
    await prisma.service.deleteMany();
    await prisma.providerType.deleteMany();
    console.log('Cleared existing data');
  } catch (e) {
    console.log('Tables may not exist yet');
  }

  // Create provider types
  const providerTypes = await Promise.all([
    prisma.providerType.create({
      data: {
        name: 'General Practitioner',
        description: 'A doctor who practices primary health care. They must be licensed by the HPCSA and have medical insurance.',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Psychologist',
        description: 'A professional who practices psychology and studies mental states, perceptual, cognitive, emotional, and social processes and behavior',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Dentist',
        description: 'A healthcare professional specializing in oral health, diagnosing and treating conditions of the teeth and gums',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Physiotherapist',
        description: 'A healthcare professional who helps restore movement and function when someone is affected by injury, illness or disability',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Specialist Physician',
        description: 'A medical doctor who has completed advanced training in a specific area of medicine such as cardiology, neurology, or endocrinology',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Dermatologist',
        description: 'A medical doctor specializing in conditions involving the skin, hair, and nails',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Optometrist',
        description: 'An eye care professional who examines eyes for vision and health problems, prescribes corrective lenses',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Dietitian',
        description: 'A healthcare professional who is an expert in nutrition and the human diet, providing dietary advice',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Occupational Therapist',
        description: 'A healthcare professional who helps people of all ages overcome challenges completing daily activities',
      },
    }),
    prisma.providerType.create({
      data: {
        name: 'Speech Therapist',
        description: 'A healthcare professional who evaluates and treats communication and swallowing disorders',
      },
    }),
  ]);
  console.log('Provider types created successfully');

  // Create services for each provider type
  const services = await Promise.all([
    // General Practitioner Services
    prisma.service.create({
      data: {
        name: 'General Consultation',
        description: 'Standard medical consultation for general health concerns',
        providerType: { connect: { name: 'General Practitioner' } },
        displayPriority: 1,
        defaultDuration: 15,
        defaultPrice: 650.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Chronic Disease Management',
        description: 'Ongoing care and management of chronic conditions like diabetes, hypertension, and asthma',
        providerType: { connect: { name: 'General Practitioner' } },
        displayPriority: 2,
        defaultDuration: 30,
        defaultPrice: 950.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Preventive Health Screening',
        description: 'Regular health check-ups and preventive screenings',
        providerType: { connect: { name: 'General Practitioner' } },
        displayPriority: 3,
        defaultDuration: 30,
        defaultPrice: 950.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Prescription Refill',
        description: 'Refill of prescription medications',
        providerType: { connect: { name: 'General Practitioner' } },
        displayPriority: 4,
        defaultDuration: 5,
        defaultPrice: 300.0,
      },
    }),

    // Psychologist Services
    prisma.service.create({
      data: {
        name: 'Individual Therapy Session',
        description: 'One-on-one psychological therapy session',
        providerType: { connect: { name: 'Psychologist' } },
        displayPriority: 1,
        defaultDuration: 50,
        defaultPrice: 1200.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Psychological Assessment',
        description: 'Comprehensive psychological evaluation and testing',
        providerType: { connect: { name: 'Psychologist' } },
        displayPriority: 2,
        defaultDuration: 90,
        defaultPrice: 2500.0,
      },
    }),

    // Dentist Services
    prisma.service.create({
      data: {
        name: 'Dental Consultation',
        description: 'General dental examination and consultation',
        providerType: { connect: { name: 'Dentist' } },
        displayPriority: 1,
        defaultDuration: 30,
        defaultPrice: 800.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Teeth Cleaning',
        description: 'Professional dental cleaning and polishing',
        providerType: { connect: { name: 'Dentist' } },
        displayPriority: 2,
        defaultDuration: 45,
        defaultPrice: 1200.0,
      },
    }),

    // Physiotherapist Services
    prisma.service.create({
      data: {
        name: 'Physiotherapy Assessment',
        description: 'Initial assessment of physical condition and treatment planning',
        providerType: { connect: { name: 'Physiotherapist' } },
        displayPriority: 1,
        defaultDuration: 60,
        defaultPrice: 950.0,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Physiotherapy Treatment',
        description: 'Physical therapy treatment session',
        providerType: { connect: { name: 'Physiotherapist' } },
        displayPriority: 2,
        defaultDuration: 45,
        defaultPrice: 750.0,
      },
    }),

    // Specialist Physician Services
    prisma.service.create({
      data: {
        name: 'Specialist Consultation',
        description: 'Specialized medical consultation',
        providerType: { connect: { name: 'Specialist Physician' } },
        displayPriority: 1,
        defaultDuration: 30,
        defaultPrice: 1500.0,
      },
    }),

    // Dermatologist Services
    prisma.service.create({
      data: {
        name: 'Skin Consultation',
        description: 'Dermatological examination and consultation',
        providerType: { connect: { name: 'Dermatologist' } },
        displayPriority: 1,
        defaultDuration: 30,
        defaultPrice: 1200.0,
      },
    }),

    // Optometrist Services
    prisma.service.create({
      data: {
        name: 'Eye Examination',
        description: 'Comprehensive eye health and vision examination',
        providerType: { connect: { name: 'Optometrist' } },
        displayPriority: 1,
        defaultDuration: 45,
        defaultPrice: 850.0,
      },
    }),

    // Dietitian Services
    prisma.service.create({
      data: {
        name: 'Nutritional Consultation',
        description: 'Comprehensive nutritional assessment and dietary planning',
        providerType: { connect: { name: 'Dietitian' } },
        displayPriority: 1,
        defaultDuration: 60,
        defaultPrice: 750.0,
      },
    }),

    // Occupational Therapist Services
    prisma.service.create({
      data: {
        name: 'Occupational Therapy Assessment',
        description: 'Initial assessment of daily living activities and functional abilities',
        providerType: { connect: { name: 'Occupational Therapist' } },
        displayPriority: 1,
        defaultDuration: 60,
        defaultPrice: 950.0,
      },
    }),

    // Speech Therapist Services
    prisma.service.create({
      data: {
        name: 'Speech Assessment',
        description: 'Comprehensive speech and language evaluation',
        providerType: { connect: { name: 'Speech Therapist' } },
        displayPriority: 1,
        defaultDuration: 60,
        defaultPrice: 950.0,
      },
    }),
  ]);
  console.log('Services created successfully');

  // Create requirement types
  const requirements = await Promise.all([
    // General Practitioner Requirements
    prisma.requirementType.create({
      data: {
        name: 'GP HPCSA Membership',
        description: 'Are you currently registered as a member of the Health Professions Council of South Africa (HPCSA)?',
        isRequired: true,
        validationType: 'BOOLEAN',
        validationConfig: {
          trueLabel: 'Yes, I am registered',
          falseLabel: 'No, I am not registered',
          defaultValue: null,
          helpText: 'You must be a registered HPCSA member to practice in South Africa',
          validationError: 'Please confirm your HPCSA registration status. This is a mandatory requirement.',
          placeholder: 'Select your HPCSA registration status',
        },
        displayPriority: 1,
        providerType: { connect: { name: 'General Practitioner' } },
      },
    }),
    prisma.requirementType.create({
      data: {
        name: 'GP HPCSA Registration Number',
        description: 'Please provide your HPCSA registration number (e.g., MP123456)',
        isRequired: true,
        validationType: 'TEXT',
        validationConfig: {
          minLength: 8,
          maxLength: 10,
          pattern: '^MP\\\\d{6}$',
          patternError: 'HPCSA number must start with MP followed by 6 digits',
          caseSensitive: false,
          trimWhitespace: true,
          helpText: 'Your HPCSA number can be found on your registration certificate. It starts with "MP" followed by 6 digits.',
          validationError: 'Please enter a valid HPCSA number. It should start with MP followed by exactly 6 digits.',
          placeholder: 'Enter your HPCSA number (e.g., MP123456)',
        },
        displayPriority: 2,
        providerType: { connect: { name: 'General Practitioner' } },
      },
    }),
    
    // Psychologist Requirements
    prisma.requirementType.create({
      data: {
        name: 'Psychologist HPCSA Membership',
        description: 'Are you currently registered as a member of the Health Professions Council of South Africa (HPCSA)?',
        isRequired: true,
        validationType: 'BOOLEAN',
        validationConfig: {
          trueLabel: 'Yes, I am registered',
          falseLabel: 'No, I am not registered',
          defaultValue: null,
          helpText: 'You must be a registered HPCSA member to practice in South Africa',
          validationError: 'Please confirm your HPCSA registration status. This is a mandatory requirement.',
          placeholder: 'Select your HPCSA registration status',
        },
        displayPriority: 1,
        providerType: { connect: { name: 'Psychologist' } },
      },
    }),
    prisma.requirementType.create({
      data: {
        name: 'Psychologist HPCSA Registration Number',
        description: 'Please provide your HPCSA registration number (e.g., PS123456)',
        isRequired: true,
        validationType: 'TEXT',
        validationConfig: {
          minLength: 8,
          maxLength: 10,
          pattern: '^PS\\\\d{6}$',
          patternError: 'HPCSA number must start with PS followed by 6 digits',
          caseSensitive: false,
          trimWhitespace: true,
          helpText: 'Your HPCSA number can be found on your registration certificate. For Psychologists, it starts with "PS" followed by 6 digits.',
          validationError: 'Please enter a valid HPCSA number. It should start with PS followed by exactly 6 digits.',
          placeholder: 'Enter your HPCSA number (e.g., PS123456)',
        },
        displayPriority: 2,
        providerType: { connect: { name: 'Psychologist' } },
      },
    }),

    // Dentist Requirements
    prisma.requirementType.create({
      data: {
        name: 'Dentist HPCSA Membership',
        description: 'Are you currently registered as a member of the Health Professions Council of South Africa (HPCSA)?',
        isRequired: true,
        validationType: 'BOOLEAN',
        validationConfig: {
          trueLabel: 'Yes, I am registered',
          falseLabel: 'No, I am not registered',
          defaultValue: null,
          helpText: 'You must be a registered HPCSA member to practice in South Africa',
          validationError: 'Please confirm your HPCSA registration status. This is a mandatory requirement.',
          placeholder: 'Select your HPCSA registration status',
        },
        displayPriority: 1,
        providerType: { connect: { name: 'Dentist' } },
      },
    }),
  ]);

  console.log('Requirements created successfully');
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
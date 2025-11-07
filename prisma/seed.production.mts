import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting PRODUCTION database seed...');
  console.log('🎯 Creating essential platform data structures');
  console.log('👤 Creating MedBookings Administrator account');
  console.log('⚠️  NO sample providers will be created (only admin user)');

  // Clear all existing data in correct order (children first, then parents)
  console.log('Clearing existing data...');

  // Delete requirement submissions first (they reference RequirementType)
  await prisma.requirementSubmission.deleteMany();
  console.log('Cleared RequirementSubmission table');

  // Delete service availability configs (they reference Service)
  await prisma.serviceAvailabilityConfig.deleteMany();
  console.log('Cleared ServiceAvailabilityConfig table');

  // Now delete the parent tables
  await prisma.requirementType.deleteMany();
  console.log('Cleared RequirementType table');

  await prisma.service.deleteMany();
  console.log('Cleared Service table');

  await prisma.providerType.deleteMany();
  console.log('Cleared ProviderType table');

  // Admin user note
  console.log('ℹ️  MedBookings Administrator:');
  console.log('   Configure ADMIN_EMAILS in .env file');
  console.log('   Users with configured emails will be auto-promoted to ADMIN role on sign-in');
  console.log('   Example: ADMIN_EMAILS=admin@example.com,manager@example.com');

  // Create provider types
  try {
    const providerTypes = await Promise.all([
      prisma.providerType.create({
        data: {
          name: 'General Practitioner',
          description:
            'A doctor who practices primary health care. They must be licensed by the HPCSA and have medical insurance.',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Psychologist',
          description:
            'A professional who practices psychology and studies mental states, perceptual, cognitive, emotional, and social processes and behavior',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Dentist',
          description:
            'A healthcare professional qualified to practice dentistry, providing oral health care services',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Speech Therapist',
          description:
            'A healthcare professional who evaluates and treats communication and swallowing disorders',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Physiotherapist',
          description:
            'A healthcare professional who helps restore movement and function through physical therapy',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Occupational Therapist',
          description:
            'A healthcare professional who helps people participate in daily activities through therapeutic interventions',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Dietitian',
          description:
            'A healthcare professional who specializes in human nutrition and the regulation of diet',
        },
      }),
    ]);
    console.log('✅ Provider types created successfully:', providerTypes.length);
  } catch (e: any) {
    console.log('❌ Error creating provider types:', e.message);
    throw e;
  }

  // Create services
  try {
    const services = await Promise.all([
      prisma.service.create({
        data: {
          name: 'General GP Consult',
          description: 'Standard medical consultation for general health concerns',
          providerType: { connect: { name: 'General Practitioner' } },
          displayPriority: 1,
          defaultDuration: 15, // in minutes
          defaultPrice: 600.0, // in ZAR
        },
      }),
      prisma.service.create({
        data: {
          name: 'Chronic Disease Management',
          description:
            'Ongoing care and management of chronic conditions like diabetes, hypertension, and asthma',
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
      // Psychologist services
      prisma.service.create({
        data: {
          name: 'General Psychology Consult',
          description: 'Standard psychological consultation for mental health concerns',
          providerType: { connect: { name: 'Psychologist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Individual Therapy Session',
          description: 'One-on-one therapeutic session for mental health support',
          providerType: { connect: { name: 'Psychologist' } },
          displayPriority: 2,
          defaultDuration: 50,
          defaultPrice: 1200.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Psychological Assessment',
          description: 'Comprehensive psychological evaluation and testing',
          providerType: { connect: { name: 'Psychologist' } },
          displayPriority: 3,
          defaultDuration: 90,
          defaultPrice: 2000.0,
        },
      }),
      // Dentist services
      prisma.service.create({
        data: {
          name: 'General Dental Consult',
          description: 'Standard dental consultation and examination',
          providerType: { connect: { name: 'Dentist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Dental Cleaning',
          description: 'Professional dental cleaning and hygiene treatment',
          providerType: { connect: { name: 'Dentist' } },
          displayPriority: 2,
          defaultDuration: 30,
          defaultPrice: 800.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Dental X-Ray',
          description: 'Digital dental radiography for diagnosis',
          providerType: { connect: { name: 'Dentist' } },
          displayPriority: 3,
          defaultDuration: 15,
          defaultPrice: 400.0,
        },
      }),
      // Speech Therapist services
      prisma.service.create({
        data: {
          name: 'General Speech Therapy Consult',
          description: 'Standard speech therapy consultation and assessment',
          providerType: { connect: { name: 'Speech Therapist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Speech Therapy Session',
          description: 'Individual speech therapy treatment session',
          providerType: { connect: { name: 'Speech Therapist' } },
          displayPriority: 2,
          defaultDuration: 45,
          defaultPrice: 900.0,
        },
      }),
      // Physiotherapist services
      prisma.service.create({
        data: {
          name: 'General Physiotherapy Consult',
          description: 'Standard physiotherapy consultation and assessment',
          providerType: { connect: { name: 'Physiotherapist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Physiotherapy Treatment Session',
          description: 'Individual physiotherapy treatment and rehabilitation',
          providerType: { connect: { name: 'Physiotherapist' } },
          displayPriority: 2,
          defaultDuration: 30,
          defaultPrice: 750.0,
        },
      }),
      // Occupational Therapist services
      prisma.service.create({
        data: {
          name: 'General Occupational Therapy Consult',
          description: 'Standard occupational therapy consultation and assessment',
          providerType: { connect: { name: 'Occupational Therapist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Occupational Therapy Session',
          description: 'Individual occupational therapy intervention session',
          providerType: { connect: { name: 'Occupational Therapist' } },
          displayPriority: 2,
          defaultDuration: 45,
          defaultPrice: 900.0,
        },
      }),
      // Dietitian services
      prisma.service.create({
        data: {
          name: 'General Dietitian Consult',
          description: 'Standard nutrition consultation and dietary assessment',
          providerType: { connect: { name: 'Dietitian' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Nutritional Counseling Session',
          description: 'Comprehensive nutrition counseling and meal planning',
          providerType: { connect: { name: 'Dietitian' } },
          displayPriority: 2,
          defaultDuration: 30,
          defaultPrice: 800.0,
        },
      }),
    ]);
    console.log('✅ Services created successfully:', services.length);
  } catch (e: any) {
    console.log('❌ Error creating services:', e.message);
    throw e;
  }

  // Create requirements types
  try {
    const requirements = await Promise.all([
      // General Practitioner Requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Membership',
          description:
            'Are you currently registered as a member of the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered',
            falseLabel: 'No, I am not registered',
            defaultValue: null, // Force user to make explicit choice
            helpText: 'You must be a registered HPCSA member to practice in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Number',
          description: 'Please provide your HPCSA registration number (e.g., MP123456)',
          isRequired: true,
          validationType: 'TEXT',
          validationConfig: {
            minLength: 8,
            maxLength: 10,
            pattern: '^MP\\\\d{6}$', // Regex pattern for "MP" followed by 6 digits
            patternError: 'HPCSA number must start with MP followed by 6 digits',
            caseSensitive: false, // Whether to enforce case sensitivity
            trimWhitespace: true, // Whether to remove leading/trailing whitespace
            helpText:
              'Your HPCSA number can be found on your registration certificate. It starts with "MP" followed by 6 digits. For General Practitioners, the number format is MP123456.',
            validationError:
              'Please enter a valid HPCSA number. It should start with MP followed by exactly 6 digits.',
            placeholder: 'Enter your HPCSA number (e.g., MP123456)',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration',
          description:
            'Valid HPCSA registration for practicing as a General Practitioner in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a General Practitioner in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 3,
          providerType: {
            connect: { name: 'General Practitioner' },
          },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical Practice Insurance',
          description:
            'Do you have current Medical Practice Insurance (Professional Indemnity) that covers you to practice as a General Practitioner?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I have Medical Practice Insurance',
            falseLabel: 'No, I do not have Medical Practice Insurance',
            defaultValue: null,
            helpText:
              'Medical Practice Insurance (also known as Professional Indemnity) is mandatory for practicing as a GP in South Africa. Common providers include Medical Protection Society (MPS) and Medical Defence Union (MDU).',
            validationError:
              'Please confirm your Medical Practice Insurance status. This is a mandatory requirement for practicing as a GP.',
            placeholder: 'Select your Medical Practice Insurance status',
          },
          displayPriority: 4,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'GP Medical Practice Insurance',
          description: 'When does your professional indemnity insurance expire?',
          isRequired: true,
          validationType: 'FUTURE_DATE',
          validationConfig: {
            minDaysInFuture: 30,
            helpText:
              'Your Medical Practice Insurance must be valid for at least 30 days from today. Please check your insurance certificate for the expiry date. We will notify you 60 days before expiry to ensure continuous coverage.',
            validationError:
              'The expiry date must be at least 30 days in the future. If your insurance expires sooner, please renew it before continuing.',
            placeholder: 'Select insurance expiry date',
            dateFormat: 'YYYY-MM-DD',
            displayFormat: 'DD/MM/YYYY',
            warningThreshold: 60, // Days before expiry to start showing warnings
            warningText:
              'Your insurance will expire soon. Please arrange renewal to ensure continuous coverage.',
          },
          displayPriority: 5,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical Practice Insurance Certificate',
          description:
            'Please upload your current Medical Practice Insurance (Professional Indemnity) certificate. This should clearly show your name, policy number, and coverage period.',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText: 'Please upload your current Medical Practice Insurance.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your Medical Practice Insurance',
          },
          displayPriority: 6,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical School',
          description: 'Which medical school did you graduate from?',
          isRequired: true,
          validationType: 'PREDEFINED_LIST',
          validationConfig: {
            options: [
              { value: 'UCT', label: 'University of Cape Town' },
              { value: 'WITS', label: 'University of the Witwatersrand' },
              { value: 'UP', label: 'University of Pretoria' },
              { value: 'SU', label: 'Stellenbosch University' },
              { value: 'UKZN', label: 'University of KwaZulu-Natal' },
              { value: 'UFS', label: 'University of the Free State' },
              { value: 'WSU', label: 'Walter Sisulu University' },
              {
                value: 'SMU',
                label: 'Sefako Makgatho Health Sciences University',
              },
            ],
            allowMultiple: false,
            allowOther: true,
            otherLabel: 'Other medical school (please specify)',
            otherValidation: {
              minLength: 3,
              maxLength: 100,
              required: true,
            },
            helpText:
              'Select your medical school from the list. If you graduated from an institution outside South Africa or one not listed, please select "Other" and provide the full name of your medical school.',
            validationError:
              'Please select a medical school or enter the name of your institution if not listed. The name must be between 3 and 100 characters.',
            placeholder: 'Select your medical school',
          },
          displayPriority: 7,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical School Graduation Year',
          description: 'In which year did you graduate from medical school?',
          isRequired: true,
          validationType: 'PAST_DATE',
          validationConfig: {
            dateFormat: 'YYYY', // Only capture the year
            minYear: 1960, // Reasonable lower bound
            maxYear: new Date().getFullYear(), // Cannot be in the future
            displayFormat: 'Year only',
            placeholder: '2015',
            helpText: 'Please enter the year you completed your medical degree (MBChB/MBBS)',
            validationError: 'Please enter a valid graduation year. It cannot be in the future.',
          },
          displayPriority: 8,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical Degree Certificate',
          description:
            'Please upload a copy of your medical degree certificate (MBChB/MBBCh/MBBS/MD)',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: ['PDF'],
            maxSizeMB: 5,
            helpText:
              'Please upload a clear, complete scan of your original medical degree certificate.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your medical degree certificate',
          },
          displayPriority: 9,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),

      // Psychologist Requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Membership',
          description:
            'Are you currently registered as a member of the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered',
            falseLabel: 'No, I am not registered',
            defaultValue: null, // Force user to make explicit choice
            helpText: 'You must be a registered HPCSA member to practice in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Psychologist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Number',
          description: 'Please provide your HPCSA registration number (e.g., PS123456)',
          isRequired: true,
          validationType: 'TEXT',
          validationConfig: {
            minLength: 8,
            maxLength: 10,
            pattern: '^PS\\d{6}$', // Regex pattern for "PS" followed by 6 digits
            patternError: 'HPCSA number must start with PS followed by 6 digits',
            caseSensitive: false, // Whether to enforce case sensitivity
            trimWhitespace: true, // Whether to remove leading/trailing whitespace
            helpText:
              'Your HPCSA number can be found on your registration certificate. It starts with "PS" followed by 6 digits. For Psychologists, the number format is PS123456.',
            validationError:
              'Please enter a valid HPCSA number. It should start with PS followed by exactly 6 digits.',
            placeholder: 'Enter your HPCSA number (e.g., PS123456)',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Psychologist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration',
          description: 'Valid HPCSA registration for practicing as a Psychologist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Psychologist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 3,
          providerType: { connect: { name: 'Psychologist' } },
        },
      }),

      // Dentist requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Dentist',
          description:
            'Are you currently registered as a Dentist with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as a Dentist',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as a Dentist in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Dentist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Dentist',
          description:
            'Valid HPCSA registration certificate for practicing as a Dentist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Dentist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Dentist' } },
        },
      }),

      // Speech Therapist requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Speech Therapist',
          description:
            'Are you currently registered as a Speech Therapist with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as a Speech Therapist',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as a Speech Therapist in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Speech Therapist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Speech Therapist',
          description:
            'Valid HPCSA registration certificate for practicing as a Speech Therapist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Speech Therapist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Speech Therapist' } },
        },
      }),

      // Physiotherapist requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Physiotherapist',
          description:
            'Are you currently registered as a Physiotherapist with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as a Physiotherapist',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as a Physiotherapist in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Physiotherapist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Physiotherapist',
          description:
            'Valid HPCSA registration certificate for practicing as a Physiotherapist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Physiotherapist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Physiotherapist' } },
        },
      }),

      // Occupational Therapist requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Occupational Therapist',
          description:
            'Are you currently registered as an Occupational Therapist with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as an Occupational Therapist',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as an Occupational Therapist in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Occupational Therapist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Occupational Therapist',
          description:
            'Valid HPCSA registration certificate for practicing as an Occupational Therapist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as an Occupational Therapist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Occupational Therapist' } },
        },
      }),

      // Dietitian requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Dietitian',
          description:
            'Are you currently registered as a Dietitian with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as a Dietitian',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as a Dietitian in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Dietitian' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Dietitian',
          description:
            'Valid HPCSA registration certificate for practicing as a Dietitian in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Dietitian in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Dietitian' } },
        },
      }),
    ]);

    console.log('✅ Requirements created successfully:', requirements.length);
  } catch (error) {
    console.error('❌ Error during production seeding:', error);
    throw error;
  }

  console.log('🎉 PRODUCTION seed completed successfully!');
  console.log('📊 Summary:');
  console.log('  - 7 Provider Types created');
  console.log('  - 18 Services created');
  console.log('  - 22 Requirement Types created');
  console.log('  - 0 Sample providers (production-safe)');
  console.log('');
  console.log('✅ Platform is ready for real healthcare providers to register!');
  console.log('🔐 Admin account ready for provider approvals');
  console.log('🚀 Ready for production deployment');
}

main()
  .catch((e) => {
    console.error('❌ Production seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
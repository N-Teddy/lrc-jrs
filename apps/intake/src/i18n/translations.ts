export type Language = 'fr' | 'en';

export const translations = {
  fr: {
    header: {
      title: 'Inscription des Membres',
      subtitle:
        'Veuillez renseigner vos coordonnées ci-dessous pour soumettre votre inscription.',
      location: "Lieu d'enregistrement",
      expiresSoon: 'Expire très bientôt',
      validForHours: 'Valide encore {{count}} heure',
      validForHours_plural: 'Valide encore {{count}} heures',
      validForDays: 'Valide encore {{count}} jour',
      validForDays_plural: 'Valide encore {{count}} jours',
      noteFromCoordinator: 'Message du coordinateur',
    },
    form: {
      randomize: 'Aléatoire',
      uploadPhoto: 'Ajouter une photo',
      personalInfo: '1. Informations Personnelles',
      fullName: 'Nom complet',
      fullNamePlaceholder: 'ex. Jean Dupont',
      gender: 'Genre',
      male: 'Masculin',
      female: 'Féminin',
      dateOfBirth: 'Date de naissance',
      selectDateOfBirth: 'Sélectionner la date de naissance',
      yearsOld: '{{count}} ans',
      contactDetails: '2. Coordonnées de Contact',
      phoneNumber: 'Numéro de téléphone / WhatsApp',
      phoneHelper:
        'Utilisé par votre coordinateur local pour confirmation et suivi.',
      email: 'Adresse e-mail',
      emailPlaceholder: 'nom@example.com',
      optional: 'Optionnel',
      location: "Lieu d'enregistrement :",
      submit: "Soumettre l'inscription",
      submitting: "Envoi de l'inscription...",
      securityNotice:
        'Transmission sécurisée. Vos données seront examinées et vérifiées par votre coordinateur local.',
    },
    datePicker: {
      today: "Aujourd'hui",
      clear: 'Effacer',
      selectDate: 'Sélectionner une date',
      prevMonth: 'Mois précédent',
      nextMonth: 'Mois suivant',
      months: [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre',
      ],
      monthsShort: [
        'Jan',
        'Fév',
        'Mar',
        'Avr',
        'Mai',
        'Juin',
        'Juil',
        'Août',
        'Sep',
        'Oct',
        'Nov',
        'Déc',
      ],
      daysShort: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
    },
    success: {
      badge: 'Inscription transmise',
      welcome: 'Merci, {{name}} !',
      description:
        'Vos informations ont été soumises pour {{town}} et sont en attente de vérification par le coordinateur.',
      referenceCode: "Code de référence d'inscription",
      referenceHelper: 'Conservez ce code de référence pour votre suivi.',
      copy: 'Copier',
      copied: 'Copié',
      whatHappensNext: 'Que se passe-t-il ensuite ?',
      step1Title: '1. Inscription enregistrée',
      step1Desc: 'Vos informations sont stockées en toute sécurité.',
      step2Title: '2. Vérification par le coordinateur',
      step2Desc:
        'Votre Personne Contact (PC) locale examinera et validera vos données.',
      step3Title: '3. Confirmation',
      step3Desc:
        'Vous serez contacté(e) via WhatsApp/téléphone une fois validé(e).',
      whatsappNotice:
        'Gardez votre WhatsApp actif pour recevoir les confirmations et mises à jour.',
      submitAnother: 'Soumettre une autre inscription',
    },
    expired: {
      title: "Lien d'inscription expiré",
      defaultMessage: "Ce lien d'inscription n'est plus actif ou a expiré.",
      location: "Lieu d'enregistrement :",
      expiredAt: 'Expiré le :',
      howToGetNewLink: 'Comment obtenir un nouveau lien :',
      howToGetNewLinkDesc:
        'Veuillez contacter votre Personne Contact (PC) ou coordinateur local pour demander un nouveau lien.',
      reloadPage: 'Recharger la page',
    },
    noToken: {
      title: 'Inscription des Membres LRC',
      description:
        "Pour soumettre votre inscription, veuillez ouvrir le lien d'invitation dédié partagé par votre Personne Contact (PC) ou coordinateur.",
      inputPlaceholder: "Saisir le code ou jeton d'invitation",
      submitButton: 'Ouvrir le formulaire',
    },
    error: {
      submissionError: "Erreur lors de l'envoi :",
      serverError:
        'Impossible de joindre le serveur JRS. Veuillez vérifier que le serveur est accessible.',
      linkInvalidOrExpired: "Le lien d'inscription est invalide ou expiré.",
      checkInformation:
        'Échec de la soumission. Veuillez vérifier vos informations.',
    },
    footer: {
      copyright:
        "© 2026 LRC Jeunesse (JRS) • Portail d'inscription des membres",
      subtitle:
        "Portail officiel d'inscription des membres • Vérifié par l'équipe de coordination",
    },
  },
  en: {
    header: {
      title: 'Member Registration',
      subtitle:
        'Please fill in your personal details below to submit your registration.',
      location: 'Registration location',
      expiresSoon: 'Expires very soon',
      validForHours: 'Valid for {{count}} more hour',
      validForHours_plural: 'Valid for {{count}} more hours',
      validForDays: 'Valid for {{count}} more day',
      validForDays_plural: 'Valid for {{count}} more days',
      noteFromCoordinator: 'Note from coordinator',
    },
    form: {
      randomize: 'Randomize',
      uploadPhoto: 'Upload Photo',
      personalInfo: '1. Personal Information',
      fullName: 'Full Name',
      fullNamePlaceholder: 'e.g. Jean Dupont',
      gender: 'Gender',
      male: 'Male',
      female: 'Female',
      dateOfBirth: 'Date of Birth',
      selectDateOfBirth: 'Select date of birth',
      yearsOld: '{{count}} years old',
      contactDetails: '2. Contact Details',
      phoneNumber: 'Phone / WhatsApp Number',
      phoneHelper:
        'Used by your local coordinator for confirmation and updates.',
      email: 'Email Address',
      emailPlaceholder: 'name@example.com',
      optional: 'Optional',
      location: 'Registration location:',
      submit: 'Submit Registration',
      submitting: 'Submitting Registration...',
      securityNotice:
        'Secure submission. Your details will be reviewed and verified by your local coordinator.',
    },
    datePicker: {
      today: 'Today',
      clear: 'Clear',
      selectDate: 'Select date',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      monthsShort: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      daysShort: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    },
    success: {
      badge: 'Registration Submitted',
      welcome: 'Thank you, {{name}}!',
      description:
        'Your registration details have been submitted for {{town}} and are awaiting coordinator verification.',
      referenceCode: 'Registration Reference Code',
      referenceHelper: 'Keep this reference code for your records.',
      copy: 'Copy',
      copied: 'Copied',
      whatHappensNext: 'What happens next?',
      step1Title: '1. Submission Recorded',
      step1Desc: 'Your information is securely queued for review.',
      step2Title: '2. Coordinator Verification',
      step2Desc:
        'Your local Contact Person (PC) will review and confirm your details.',
      step3Title: '3. Confirmation',
      step3Desc: 'You will be contacted via WhatsApp/phone once confirmed.',
      whatsappNotice:
        'Keep your WhatsApp active to receive confirmation and updates.',
      submitAnother: 'Submit another registration',
    },
    expired: {
      title: 'Registration Link Expired',
      defaultMessage:
        'This registration link is no longer active or has expired.',
      location: 'Registration Location:',
      expiredAt: 'Expired At:',
      howToGetNewLink: 'How to get a new link:',
      howToGetNewLinkDesc:
        'Please contact your local Contact Person (PC) or coordinator to request a renewed registration link.',
      reloadPage: 'Reload Page',
    },
    noToken: {
      title: 'LRC Member Registration',
      description:
        'To submit your registration, please open the dedicated invitation link shared by your Contact Person (PC) or coordinator.',
      inputPlaceholder: 'Enter link invitation code or token',
      submitButton: 'Open Registration Form',
    },
    error: {
      submissionError: 'Submission Error:',
      serverError:
        'Could not connect to the JRS server. Please make sure the backend server is running and accessible.',
      linkInvalidOrExpired: 'Registration link is invalid or expired.',
      checkInformation:
        'Failed to submit registration details. Please check your information.',
    },
    footer: {
      copyright: '© 2026 LRC Jeunesse (JRS) • Member Registration Portal',
      subtitle:
        'Official member intake portal • Verified by local coordination team',
    },
  },
} as const;

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────
const ADMIN_PIN = "6202csacgspaga";
const CAMPUS_RADIUS_KM = 2.0;
// Refined using SITRA Junction / Airport Road / Avinashi Road reference
// points (confirmed via the user's own OpenStreetMap screenshot showing
// "PSG College of Arts and Science" labeled just south of SITRA Junction).
// Airport Road Sitra is verified at 11.037176, 77.037793 — campus sits
// just southwest of that junction along Avinashi Road. This is closer
// than previous attempts but still NOT a building-precise GPS reading.
// For true pin accuracy: open Google Maps while standing at the main
// gate, long-press your position, and replace this with that exact
// lat/lng reading.
const CAMPUS_CENTER = { lat: 11.0345, lng: 77.0355 }; // near SITRA Jn / Avinashi Rd, Coimbatore 641014

// ─────────────────────────────────────────────────────────────────────────
// LANGUAGE — Tamil default, English toggle. Key screens translated first.
// ─────────────────────────────────────────────────────────────────────────
const STRINGS = {
  ta: {
    // ── App branding ───────────────────────────────────────────────
    appTitle: "AGA அவசர சேவை",
    appSubtitle: "Alert Golden Army PSGCAS Chapter",
    partnerText: "PSG கலை மற்றும் அறிவியல் கல்லூரி, கோயம்புத்தூர்",
    // ── Location gate ─────────────────────────────────────────────
    locationRequired: "இருப்பிட அனுமதி தேவை",
    locationRequiredDesc: "AGA அவசர சேவைக்கு உங்கள் இருப்பிடம் தேவை.",
    enableLocation: "இருப்பிடத்தை இயக்கு",
    locationActive: "📍 இருப்பிடம் செயலில் உள்ளது — உதவ தயாராக உள்ளோம்",
    locationDeniedMsg: "உங்கள் உலாவி சாளரத்தில் உள்ள இருப்பிட அனுமதி popup பார்த்தால் 'அனுமதி' என்பதை தட்டவும், பின்னர் மீண்டும் இயக்கவும்.",
    openSettings: "சாதன அமைப்புகளை திறக்கவும்",
    // ── Phone number gate ─────────────────────────────────────────
    phoneGateTitle: "ஒரு கூடுதல் படி",
    phoneGateDesc: "உங்கள் தொலைபேசி எண்ணை உள்ளிடவும் — SOS அல்லது Call Now அழுத்தும்போது தன்னார்வலர் நேரடியாக உங்களை அழைக்க முடியும்.",
    phoneGateLabel: "உங்கள் தொலைபேசி எண் *",
    phoneGateSave: "சேமித்து தொடரவும்",
    phoneGateSaved: "நிரந்தரமாக சேமிக்கப்பட்டது — மீண்டும் கேட்கப்படமாட்டோம்.",
    // ── Login ─────────────────────────────────────────────────────
    loginTitle: "🔑 தன்னார்வலர் உள்நுழைவு",
    loginDesc: "உங்கள் மின்னஞ்சல் மூலம் உள்நுழையவும். பயன்பாட்டை நிறுவல் நீக்கி மீண்டும் நிறுவினாலும், அதே மின்னஞ்சலில் உள்நுழைந்தால் உங்கள் சுயவிவரம் திரும்பும்.",
    loginWithGoogle: "Google மூலம் தொடரவும்",
    loginWithEmail: "மின்னஞ்சல் மூலம் தொடரவும்",
    emailLabel: "மின்னஞ்சல் முகவரி *",
    emailPlaceholder: "yourname@example.com",
    emailError: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
    continueBtn: "தொடரவும்",
    cancelBtn: "ரத்து செய்",
    // ── Home screen ───────────────────────────────────────────────
    sosButton: "SOS — அவசரம்",
    findMembers: "அருகிலுள்ள தன்னார்வலர்களைக் காண்க",
    emergencyContacts: "அவசர தொடர்புகள்",
    campusMap: "வளாக வரைபடம்",
    registerVolunteer: "தன்னார்வலராக பதிவு செய்க",
    firstAidGuide: "அவசரகால முதலுதவி வழிகாட்டி",
    dashboard: "📊 டாஷ்போர்டு",
    yourLocation: "உங்கள் இருப்பிடம்",
    // ── Stats ─────────────────────────────────────────────────────
    totalVolunteers: "மொத்த தன்னார்வலர்கள்",
    activeVolunteers: "செயலில் உள்ளவர்கள்",
    sosToday: "இன்றைய SOS கோரிக்கைகள்",
    casesHandled: "கையாளப்பட்ட வழக்குகள்",
    // ── Nav bar ───────────────────────────────────────────────────
    home: "முகப்பு",
    volunteers: "தன்னார்வலர்கள்",
    myAlerts: "என் விழிப்பூட்டல்கள்",
    register: "பதிவு",
    admin: "நிர்வாகி",
    // ── Volunteers screen ─────────────────────────────────────────
    nearbyVolunteers: "🆘 அருகிலுள்ள தன்னார்வலர்கள்",
    nearbySubtitle: "உங்கள் இருப்பிடத்திலிருந்து 2 கி.மீ. தொலைவில் உள்ள தன்னார்வலர்கள்",
    filterAll: "அனைவரும்",
    filterAvailable: "கிடைக்கிறார்கள்",
    filterCertified: "சான்றிதழ் பெற்றவர்கள்",
    noVolunteers: "அருகிலுள்ள தன்னார்வலர்கள் யாரும் கிடைக்கவில்லை.",
    callNow: "இப்போது அழைக்கவும்",
    viewMap: "வரைபடம் காண்க",
    away: "தொலைவில்",
    online: "ஆன்லைனில்",
    offline: "ஆஃப்லைனில்",
    available: "கிடைக்கிறார்",
    unavailable: "கிடைக்கவில்லை",
    certified: "முதலுதவி சான்றிதழ் பெற்றவர்",
    notCertified: "சான்றிதழ் இல்லை",
    respondingSince: "SOS க்கு பதிலளிக்கிறார் · தொடங்கியது",
    arrived: "உங்கள் இருப்பிடத்தை அடைந்தார்",
    volunteerPhone: "தன்னார்வலரின் தொலைபேசி",
    // ── Map screen ────────────────────────────────────────────────
    volunteerLocation: "🗺 தன்னார்வலர் இருப்பிடம்",
    exactDistance: "சரியான தொலைவு",
    walkTime: "நடை நேரம்",
    liveTracking: "நேரடி கண்காணிப்பு — ஒவ்வொரு 2 வினாடியும் புதுப்பிக்கப்படுகிறது",
    navigateTo: "🧭 தன்னார்வலரை நோக்கி செல்லவும்",
    callDirectly: "📞 நேரடியாக அழைக்கவும்",
    mapNote: "இலவச OpenStreetMap — Google Maps கட்டணம் இல்லை",
    backBtn: "← திரும்பு",
    // ── Campus map ────────────────────────────────────────────────
    campusMapTitle: "🗺️ வளாக வரைபடம்",
    campusMapSubtitle: "PSG கலை மற்றும் அறிவியல் கல்லூரி, கோயம்புத்தூர்",
    openFullMap: "🌍 முழு வரைபடம் திறக்கவும் (OpenStreetMap)",
    keyLocations: "📍 முக்கிய இடங்கள்",
    comingSoon: "விரைவில்",
    comingSoonDesc: "நேரடி தன்னார்வலர் இருப்பிடங்கள், நிகழ்நேர வழிசெலுத்தல் மற்றும் அவசர இடங்களுக்கான வழிகாட்டல்.",
    // ── Emergency contacts ────────────────────────────────────────
    emergencyContactsTitle: "📞 அவசர தொடர்புகள்",
    contactsAdminNote: "தட்டி அழைக்கவும். எண்களை திருத்த திருத்து ஐகானை பயன்படுத்தவும்.",
    contactsUserNote: "நேரடியாக அழைக்க எந்த தொடர்பையும் தட்டவும்.",
    tapToCall: "அழைக்க தட்டவும்",
    addContact: "➕ அவசர தொடர்பை சேர்க்கவும்",
    contactNote: "இந்த எண்கள் நிர்வாக குழுவால் நிர்வகிக்கப்படுகின்றன.",
    editContact: "தொடர்பை திருத்து",
    addNewContact: "புதிய தொடர்பை சேர்க்கவும்",
    iconLabel: "ஐகான் (emoji)",
    labelField: "பெயர்",
    phoneNumber: "தொலைபேசி எண்",
    description: "விளக்கம்",
    saveBtn: "சேமி",
    // ── Register / Profile ────────────────────────────────────────
    regTitle: "📝 தன்னார்வலர் பதிவு",
    editTitle: "✏️ என் விவரங்களை திருத்து",
    pendingApproval: "நிர்வாகி ஒப்புதலுக்காக காத்திருக்கிறது",
    pendingDesc: "நீங்கள் அனுமதிக்கப்பட்ட தன்னார்வலர்களுக்கு மட்டுமே அவசர தேடல் முடிவுகளில் தோன்றுவீர்கள்.",
    editDesc: "எந்த நேரத்திலும் தவறுகளை சரிசெய்யலாம். ஒப்புதல் நிலை மாறாது.",
    fullName: "முழு பெயர் *",
    rollNumber: "சட்ட எண் (விருப்பத்திற்குரியது)",
    emailId: "மின்னஞ்சல் *",
    phone: "தொலைபேசி எண் *",
    department: "துறை (விருப்பத்திற்குரியது)",
    yearOfStudy: "படிப்பு ஆண்டு (விருப்பத்திற்குரியது)",
    occupation: "தொழில் (விருப்பத்திற்குரியது)",
    occupationPlaceholder: "எ.கா. மாணவர், மருத்துவர், ஆசிரியர், பணியாளர்",
    firstAidTrained: "முதலுதவி பயிற்சி முடித்தீர்களா?",
    firstAidCertified: "முதலுதவி சான்றிதழ் உள்ளதா? *",
    trainingDetails: "முதலுதவி பயிற்சி விவரங்கள் *",
    trainingPlaceholder: "எ.கா. Red Cross Basic First Aid, 2024",
    submitApplication: "விண்ணப்பத்தை சமர்ப்பிக்கவும்",
    saveChanges: "மாற்றங்களை சேமிக்கவும்",
    submitting: "சமர்ப்பிக்கிறது...",
    saving: "சேமிக்கிறது...",
    yes: "ஆம்",
    no: "இல்லை",
    // ── After register ────────────────────────────────────────────
    appSubmitted: "விண்ணப்பம் சமர்ப்பிக்கப்பட்டது",
    appSubmittedDesc: "உங்கள் விண்ணப்பம் நிர்வாகிக்கு அனுப்பப்பட்டது. ஒப்புதல் அல்லது நிராகரிப்பு வரும்போது அறிவிப்பு வரும்.",
    appSavedDesc: "உங்கள் சுயவிவரம் சேமிக்கப்பட்டது — மீண்டும் நிறுவலிலும் இந்த மின்னஞ்சலில் உள்நுழைந்தால் திரும்பும்.",
    backToHome: "முகப்பு திரும்பு",
    // ── Profile status ────────────────────────────────────────────
    applicationPending: "விண்ணப்பம் நிலுவையில் உள்ளது",
    pendingStatusDesc: "உங்கள் விண்ணப்பம் மதிப்பாய்வில் உள்ளது. நிர்வாகி ஒப்புதல் அல்லது நிராகரிப்பு வழங்கும்போது அறிவிப்பு வரும்.",
    submittedDetails: "சமர்ப்பிக்கப்பட்ட விவரங்கள்",
    editMyDetails: "✏️ என் விவரங்களை திருத்து",
    myProfile: "👤 என் சுயவிவரம்",
    approvedVolunteer: "✓ அனுமதிக்கப்பட்ட தன்னார்வலர்",
    yourDetails: "உங்கள் விவரங்கள்",
    profileNote: "நீங்கள் தன்னார்வலர் பட்டியலில் உள்ளீர்கள். யாரேனும் SOS அழுத்தினால் உடனே அறிவிப்பு வரும்.",
    viewMyAlerts: "🔔 என் விழிப்பூட்டல்களை காண்க",
    // ── Volunteer alerts ─────────────────────────────────────────
    myAlertsTitle: "🔔 என் விழிப்பூட்டல்கள்",
    alertsSubtitle: "உங்களுக்கு அனுப்பப்பட்ட விழிப்பூட்டல்கள்",
    noAlertsMsg: "இன்னும் விழிப்பூட்டல்கள் இல்லை. யாரேனும் உங்களை அழைத்தால் அல்லது அருகில் SOS அழுத்தினால் உடனே இங்கு வரும்.",
    lockMsg: "விழிப்பூட்டல்களைப் பெற உள்நுழைந்து தன்னார்வலராக பதிவு செய்யவும்.",
    respondingNow: "நீங்கள் இப்போது பதிலளிக்கிறீர்கள்",
    respondingDesc: "உங்கள் இருப்பிடம் நபருடன் பகிரப்படுகிறது — தொடங்கியது",
    stopResponse: "நிறுத்து",
    navigateToPerson: "🧭 இந்த நபரிடம் செல்லவும்",
    imResponding: "🏃 நான் பதிலளிக்கிறேன் — என் இருப்பிடத்தை பகிர்",
    userPhone: "📞 பயனரின் தொலைபேசி",
    responderInfo: "பதிலளிப்பவர்",
    sharingLocation: "✓ இந்த SOS க்கு உங்கள் இருப்பிடம் பகிரப்படுகிறது",
    // ── Admin ─────────────────────────────────────────────────────
    adminTitle: "🛡 நிர்வாக டாஷ்போர்டு",
    adminAccess: "🔐 நிர்வாக அணுகல்",
    adminPinDesc: "தொடர நிர்வாக குறியீட்டை உள்ளிடவும்",
    adminPinPlaceholder: "நிர்வாக குறியீட்டை உள்ளிடவும்",
    unlockDashboard: "டாஷ்போர்டை திறக்கவும்",
    invalidPin: "தவறான நிர்வாக குறியீடு.",
    tabAlerts: "🔔 விழிப்பூட்டல்கள்",
    tabPending: "⏳ நிலுவை",
    tabApproved: "✅ அனுமதிக்கப்பட்டவர்கள்",
    tabContacts: "📞 தொடர்புகள்",
    tabGuide: "🩺 வழிகாட்டி",
    tabBroadcast: "📢 ஒளிபரப்பு",
    noAlerts: "விழிப்பூட்டல்கள் இல்லை.",
    noPending: "நிலுவையில் உள்ள தன்னார்வலர்கள் இல்லை.",
    noApproved: "அனுமதிக்கப்பட்ட தன்னார்வலர்கள் இல்லை.",
    approve: "✓ அனுமதி",
    reject: "✗ நிராகரி",
    remove: "அகற்று",
    confirmReject: "இந்த விண்ணப்பத்தை நிராகரிக்கவா?",
    confirmRemove: "இந்த தன்னார்வலரை அகற்றவா?",
    broadcastLabel: "அவசரகால ஒளிபரப்பு செய்தி",
    broadcastPlaceholder: "எ.கா. இன்று மாலை 3 மணிக்கு வளாகத்தில் பயிற்சி. அனைத்து தன்னார்வலர்களும் எச்சரிக்கையாக இருக்கவும்.",
    sendBroadcast: "📢 அனைத்து அனுமதிக்கப்பட்ட தன்னார்வலர்களுக்கும் அனுப்பவும்",
    broadcastSent: "ஒளிபரப்பு",
    broadcastSentTo: "அனுமதிக்கப்பட்ட தன்னார்வலர்களுக்கு அனுப்பப்பட்டது.",
    // ── First Aid Guide ───────────────────────────────────────────
    firstAidTitle: "🩺 அவசரகால முதலுதவி வழிகாட்டி",
    firstAidSubtitle: "அடிப்படை முதலுதவி நுட்பங்கள் — PSG CAS Alert Golden Army",
    editSection: "பிரிவை திருத்து",
    sectionTitle: "பிரிவு தலைப்பு",
    contentLabel: "உள்ளடக்கம்",
    contentHint: 'ஒவ்வொரு துணை பிரிவையும் "## தலைப்பு" மூலம் தொடங்கவும். கீழே ஒவ்வொரு புள்ளியும் தனி வரியில்.',
    // ── Alert types ───────────────────────────────────────────────
    alertCall: "அழைப்பு விழிப்பூட்டல்",
    alertMap: "வரைபட பார்வை விழிப்பூட்டல்",
    alertSOS: "SOS — அவசரம்",
    alertApproved: "ஒப்புதல் அனுப்பப்பட்டது",
    alertRejected: "நிராகரிப்பு அனுப்பப்பட்டது",
    alertBroadcast: "ஒளிபரப்பு அனுப்பப்பட்டது",
    alertStandDown: "SOS ஏற்றுக்கொள்ளப்பட்டது — நிறுத்தவும்",
    alertDispatched: "விழிப்பூட்டல் அனுப்பப்பட்டது",
    // ── SOS ──────────────────────────────────────────────────────
    sosNoVolunteers: "இப்போது அருகில் தன்னார்வலர்கள் யாரும் இல்லை. நேரடியாக அவசர தொடர்புகளை அழைக்கவும்.",
    sosSent: "🚨 SOS அனுப்பப்பட்டது",
    sosSentTo: "அருகிலுள்ள தன்னார்வலர்களுக்கு உதவி வருகிறது.",
    // ── Details saved ─────────────────────────────────────────────
    detailsUpdated: "விவரங்கள் புதுப்பிக்கப்பட்டன",
    changesSaved: "உங்கள் மாற்றங்கள் சேமிக்கப்பட்டன.",
    backToProfile: "என் சுயவிவரம் திரும்பு",
    // ── Fields ────────────────────────────────────────────────────
    required: "தேவையானது",
    optional: "விருப்பத்திற்குரியது",
    namePlaceholder: "எ.கா. கார்த்திக் ர",
    rollPlaceholder: "எ.கா. 23CS101",
    deptPlaceholder: "எ.கா. கணினி அறிவியல்",
    yearPlaceholder: "எ.கா. 2வது ஆண்டு",
    phonePlaceholder: "+91 9XXXXXXXXX",
    nameError: "முழு பெயர் தேவை.",
    emailError2: "சரியான மின்னஞ்சல் தேவை.",
    phoneError: "தொலைபேசி எண் தேவை.",
    remarksError: "முதலுதவி பயிற்சி விவரங்கள் தேவை.",
    certError: "ஆம் அல்லது இல்லை என்று தேர்வு செய்யவும்.",
  },
  en: {
    // ── App branding ───────────────────────────────────────────────
    appTitle: "AGA EMERGENCY RESPONSE",
    appSubtitle: "Alert Golden Army PSGCAS Chapter",
    partnerText: "PSG College of Arts & Science, Coimbatore",
    // ── Location gate ─────────────────────────────────────────────
    locationRequired: "Location Access Required",
    locationRequiredDesc: "AGA Emergency Response needs your location to function.",
    enableLocation: "Enable Location",
    locationActive: "📍 Location active — ready to assist",
    locationDeniedMsg: "If your browser shows a location permission popup, tap Allow, then tap Enable Location again.",
    openSettings: "Open Device Settings",
    // ── Phone number gate ─────────────────────────────────────────
    phoneGateTitle: "One more step",
    phoneGateDesc: "Enter your phone number so volunteers can call you back directly if the map or app has any issue.",
    phoneGateLabel: "Your Phone Number *",
    phoneGateSave: "Save & Continue",
    phoneGateSaved: "Saved permanently — never asked again.",
    // ── Login ─────────────────────────────────────────────────────
    loginTitle: "🔑 Volunteer Login",
    loginDesc: "Sign in with your email ID first. Even if you uninstall and reinstall the app, logging in again with the same account restores everything.",
    loginWithGoogle: "Continue with Google",
    loginWithEmail: "Continue with Email",
    emailLabel: "Email ID *",
    emailPlaceholder: "yourname@example.com",
    emailError: "Please enter a valid email ID.",
    continueBtn: "Continue",
    cancelBtn: "Cancel",
    // ── Home screen ───────────────────────────────────────────────
    sosButton: "SOS — EMERGENCY",
    findMembers: "Find Nearby Volunteers",
    emergencyContacts: "Emergency Contacts",
    campusMap: "Campus Map",
    registerVolunteer: "Register as a Volunteer",
    firstAidGuide: "Emergency First Aid Guide",
    dashboard: "📊 Dashboard",
    yourLocation: "YOUR LOCATION",
    // ── Stats ─────────────────────────────────────────────────────
    totalVolunteers: "Total Volunteers",
    activeVolunteers: "Active Volunteers",
    sosToday: "SOS Requests Today",
    casesHandled: "Cases Handled",
    // ── Nav bar ───────────────────────────────────────────────────
    home: "Home",
    volunteers: "Volunteers",
    myAlerts: "My Alerts",
    register: "Register",
    admin: "Admin",
    // ── Volunteers screen ─────────────────────────────────────────
    nearbyVolunteers: "🆘 Nearby Volunteers",
    nearbySubtitle: "Showing volunteers within 2km of your location",
    filterAll: "All",
    filterAvailable: "Available",
    filterCertified: "Certified",
    noVolunteers: "No volunteers found nearby.",
    callNow: "Call Now",
    viewMap: "View Map",
    away: "away",
    online: "Online",
    offline: "Offline",
    available: "Available",
    unavailable: "Unavailable",
    certified: "First Aid Certified",
    notCertified: "Not Certified",
    respondingSince: "Responding to your SOS · live since",
    arrived: "Has arrived at your location",
    volunteerPhone: "VOLUNTEER'S PHONE",
    // ── Map screen ────────────────────────────────────────────────
    volunteerLocation: "🗺 Volunteer Location",
    exactDistance: "Exact Distance",
    walkTime: "Walk Time",
    liveTracking: "Live — updating every 2 seconds as they move toward you",
    navigateTo: "🧭 Navigate to Volunteer",
    callDirectly: "📞 Call Directly",
    mapNote: "Free map via OpenStreetMap — no Google Maps fees. Tap Navigate for full directions.",
    backBtn: "← Back",
    // ── Campus map ────────────────────────────────────────────────
    campusMapTitle: "🗺️ Campus Map",
    campusMapSubtitle: "PSG College of Arts & Science, Coimbatore",
    openFullMap: "🌍 Open Full Map (OpenStreetMap)",
    keyLocations: "📍 Key Locations",
    comingSoon: "COMING SOON",
    comingSoonDesc: "Live volunteer locations, real-time navigation, and route guidance to emergency assembly points.",
    // ── Emergency contacts ────────────────────────────────────────
    emergencyContactsTitle: "📞 Emergency Contacts",
    contactsAdminNote: "Tap to call. Use the edit icon to update a number.",
    contactsUserNote: "Tap any contact to call immediately.",
    tapToCall: "Tap to call",
    addContact: "➕ Add Emergency Contact",
    contactNote: "These numbers are managed by the Admin team.",
    editContact: "Edit Contact",
    addNewContact: "Add New Contact",
    iconLabel: "Icon (emoji)",
    labelField: "Label",
    phoneNumber: "Phone Number",
    description: "Description",
    saveBtn: "Save",
    // ── Register / Profile ────────────────────────────────────────
    regTitle: "📝 Volunteer Registration",
    editTitle: "✏️ Edit My Details",
    pendingApproval: "PENDING ADMIN APPROVAL",
    pendingDesc: "Only admin-approved volunteers appear in emergency search results and can receive SOS alerts.",
    editDesc: "You can fix a typo or add missing details anytime. Your approval status will not change.",
    fullName: "Full Name *",
    rollNumber: "Roll Number (optional)",
    emailId: "Email ID *",
    phone: "Phone Number *",
    department: "Department (optional)",
    yearOfStudy: "Year of Study (optional)",
    occupation: "Occupation (optional)",
    occupationPlaceholder: "e.g. Student, Doctor, Faculty, Staff",
    firstAidTrained: "Have you completed First Aid Training?",
    firstAidCertified: "Do you have a First Aid Certificate? *",
    trainingDetails: "First Aid Training Details *",
    trainingPlaceholder: "e.g. Red Cross Basic First Aid, 2024",
    submitApplication: "Submit Application",
    saveChanges: "Save Changes",
    submitting: "Submitting...",
    saving: "Saving...",
    yes: "Yes",
    no: "No",
    namePlaceholder: "e.g. Karthik R",
    rollPlaceholder: "e.g. 23CS101",
    deptPlaceholder: "e.g. Computer Science",
    yearPlaceholder: "e.g. 2nd Year",
    phonePlaceholder: "+91 9XXXXXXXXX",
    nameError: "Full name is required.",
    emailError2: "A valid email is required.",
    phoneError: "Phone number is required.",
    remarksError: "First aid training details are required.",
    certError: "Please select Yes or No.",
    // ── After register ────────────────────────────────────────────
    appSubmitted: "Application Submitted",
    appSubmittedDesc: "Your application has been sent to the Admin for review. You will get a notification once it is approved or rejected.",
    appSavedDesc: "Your profile is saved — log in again with this account anytime to restore it, even after reinstalling the app.",
    backToHome: "Back to Home",
    detailsUpdated: "Details Updated",
    changesSaved: "Your changes have been saved.",
    backToProfile: "Back to My Profile",
    // ── Profile status ────────────────────────────────────────────
    applicationPending: "Application Pending",
    pendingStatusDesc: "Your volunteer application is still under review. You will get a notification the moment Admin approves or rejects it.",
    submittedDetails: "SUBMITTED DETAILS",
    editMyDetails: "✏️ Edit My Details",
    myProfile: "👤 My Profile",
    approvedVolunteer: "✓ Approved Volunteer",
    yourDetails: "YOUR DETAILS",
    profileNote: "You are live in the volunteer pool. Check the My Alerts tab any time someone calls you or triggers an SOS nearby.",
    viewMyAlerts: "🔔 View My Alerts",
    // ── Volunteer alerts ─────────────────────────────────────────
    myAlertsTitle: "🔔 My Alerts",
    alertsSubtitle: "Alerts sent to you as",
    noAlertsMsg: "No alerts yet. You will be notified here the instant someone calls you or triggers an SOS nearby.",
    lockMsg: "Log in and register as a volunteer to receive alerts here.",
    respondingNow: "You are marked as responding",
    respondingDesc: "Your location is now shared with the person — since",
    stopResponse: "Stop",
    navigateToPerson: "🧭 Navigate to This Person",
    imResponding: "🏃 I am Responding — Share My Live Location",
    userPhone: "📞 User phone",
    responderInfo: "Responder",
    sharingLocation: "✓ You are sharing your location for this SOS",
    // ── Admin ─────────────────────────────────────────────────────
    adminTitle: "🛡 Admin Dashboard",
    adminAccess: "🔐 Admin Access",
    adminPinDesc: "Enter admin code to continue",
    adminPinPlaceholder: "Enter admin code",
    unlockDashboard: "Unlock Dashboard",
    invalidPin: "Invalid admin code.",
    tabAlerts: "🔔 Alerts",
    tabPending: "⏳ Pending",
    tabApproved: "✅ Approved",
    tabContacts: "📞 Contacts",
    tabGuide: "🩺 Guide",
    tabBroadcast: "📢 Broadcast",
    noAlerts: "No alerts yet. Alerts appear instantly for SOS, Call Now, View Map, and admin approval/rejection actions.",
    noPending: "No pending volunteers.",
    noApproved: "No approved volunteers.",
    approve: "✓ Approve",
    reject: "✗ Reject",
    remove: "Remove",
    confirmReject: "Reject this application?",
    confirmRemove: "Remove this volunteer?",
    broadcastLabel: "Emergency Broadcast Message",
    broadcastPlaceholder: "e.g. Campus-wide drill at 3 PM today. All volunteers please stay alert.",
    sendBroadcast: "📢 Send to All Approved Volunteers",
    broadcastSent: "Broadcast sent to",
    broadcastSentTo: "approved volunteer(s).",
    // ── First Aid Guide ───────────────────────────────────────────
    firstAidTitle: "🩺 Emergency First Aid Guide",
    firstAidSubtitle: "Basic First Aid Techniques — PSG CAS Alert Golden Army",
    editSection: "Edit Section",
    sectionTitle: "Section Title",
    contentLabel: "Content",
    contentHint: 'Use "## Heading" to start each sub-section. One point per line below it.',
    // ── Alert types ───────────────────────────────────────────────
    alertCall: "CALL ALERT",
    alertMap: "MAP VIEW ALERT",
    alertSOS: "SOS — EMERGENCY",
    alertApproved: "APPROVAL SENT",
    alertRejected: "REJECTION SENT",
    alertBroadcast: "BROADCAST SENT",
    alertStandDown: "SOS ACCEPTED — STAND DOWN",
    alertDispatched: "Alert dispatched",
    // ── SOS ──────────────────────────────────────────────────────
    sosNoVolunteers: "No available volunteers nearby right now. Please call Emergency Contacts directly.",
    sosSent: "🚨 SOS sent to",
    sosSentTo: "nearby volunteer(s). Help is on the way.",
    // ── Fields ────────────────────────────────────────────────────
    required: "required",
    optional: "optional",
  },
};

function useLang() {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("aga_lang") || "ta"; } catch (e) { return "ta"; }
  });
  function toggle() {
    const next = lang === "ta" ? "en" : "ta";
    setLang(next);
    try { localStorage.setItem("aga_lang", next); } catch (e) {}
  }
  return { lang, t: STRINGS[lang], toggle };
}

// ─────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────
const MOCK_VOLUNTEERS = [
  { id: 1, name: "Karthik R", roll: "23CS101", department: "Computer Science", year: "3rd Year", phone: "+919876543210", email: "karthik@psgcas.edu.in", occupation: "Student", first_aid_trained: true, first_aid_certified: true, availability: true, online: true, approved: true, lat: 11.0347, lng: 77.0357, distance: 50 },
  { id: 2, name: "Priya S", roll: "22EC045", department: "Electronics", year: "2nd Year", phone: "+919876543211", email: "priya@psgcas.edu.in", occupation: "Student", first_aid_trained: true, first_aid_certified: true, availability: true, online: true, approved: true, lat: 11.0342, lng: 77.0362, distance: 120 },
  { id: 3, name: "Arjun M", roll: "21PH078", department: "Physics", year: "4th Year", phone: "+919876543212", email: "arjun@psgcas.edu.in", occupation: "Student", first_aid_trained: false, first_aid_certified: false, availability: false, online: false, approved: true, lat: 11.035, lng: 77.035, distance: 180 },
  { id: 4, name: "Kavitha L", roll: "24MA012", department: "Mathematics", year: "1st Year", phone: "+919876543213", email: "kavitha@psgcas.edu.in", occupation: "Student", first_aid_trained: true, first_aid_certified: true, availability: true, online: true, approved: true, lat: 11.0339, lng: 77.0365, distance: 240 },
];

const MOCK_PENDING = [
  { id: 5, name: "Ramesh K", roll: "23CH033", department: "Chemistry", year: "2nd Year", phone: "+919876543214", email: "ramesh@psgcas.edu.in", occupation: "Student", first_aid_trained: true, first_aid_certified: true, availability: true, online: false, approved: false, remarks: "Red Cross Basic First Aid, 2024" },
  { id: 6, name: "Divya N", roll: "22CO021", department: "Commerce", year: "3rd Year", phone: "+919876543215", email: "divya@psgcas.edu.in", occupation: "Student", first_aid_trained: false, first_aid_certified: false, availability: true, online: false, approved: false, remarks: "College Medical Camp Training" },
];

const DEFAULT_CONTACTS = [
  { key: "ambulance", icon: "🚑", label: "Ambulance", number: "108", desc: "National Emergency" },
  { key: "hospital", icon: "🏥", label: "Hospital", number: "+914222572180", desc: "Nearest Govt. Hospital" },
  { key: "security", icon: "🔐", label: "College Security", number: "+914222572177", desc: "PSG CAS Security" },
  { key: "fire", icon: "🚒", label: "Fire Service", number: "101", desc: "Fire Emergency" },
  { key: "helpdesk", icon: "🛎️", label: "College Help Desk", number: "+914222572178", desc: "General Assistance" },
  { key: "medical", icon: "⚕️", label: "Medical Room", number: "+914222572179", desc: "Campus Medical Center" },
];

// Real PSGCAS landmark names, confirmed via Wikipedia and campus sources
// (E Block, GRD Auditorium, Indoor Stadium, Library, Hostel Office,
// Stone Bench, front/back canteen are all real, named campus locations).
// Their lat/lng below are still placeholder offsets from the verified
// CAMPUS_CENTER — NOT individually GPS-confirmed yet. For pin-accurate
// placement, stand at each spot with Google Maps, long-press to get the
// exact reading, and replace these values.
const CAMPUS_LANDMARKS = [
  { name: "E Block", lat: 11.0347, lng: 77.0353, icon: "🏛️" },
  { name: "Library", lat: 11.0343, lng: 77.0359, icon: "📚" },
  { name: "GRD Auditorium", lat: 11.0349, lng: 77.0358, icon: "🎭" },
  { name: "Indoor Stadium", lat: 11.0341, lng: 77.0351, icon: "🏟️" },
  { name: "Hostel Office", lat: 11.0351, lng: 77.0362, icon: "🏠" },
  { name: "Stone Bench", lat: 11.0345, lng: 77.0356, icon: "🪑" },
];

// ─────────────────────────────────────────────────────────────────────────
// GLOBAL ALERT STORE (in-app pub/sub, simulates push notifications)
// ─────────────────────────────────────────────────────────────────────────
let globalAlerts = [];
let alertListeners = [];
function subscribeAlerts(fn) {
  alertListeners.push(fn);
  return () => { alertListeners = alertListeners.filter(l => l !== fn); };
}
function pushAlert(alert) {
  globalAlerts = [alert, ...globalAlerts].slice(0, 80);
  alertListeners.forEach(fn => fn([...globalAlerts]));
}

function sendVolunteerAlert(vol, type, extra = {}) {
  const messages = {
    call: "Someone is trying to call you for emergency help!",
    map: "Someone is viewing your location on the emergency map!",
    sos: "🚨 SOS ALERT — emergency help needed nearby!",
    approved: "Your volunteer application has been approved! You can now respond to emergencies.",
    rejected: "Your volunteer application was not approved this time.",
    broadcast: extra.message || "Emergency broadcast from Admin.",
  };
  const alertId = Date.now() + Math.random();
  pushAlert({
    id: alertId,
    volId: vol?.id,
    volEmail: vol?.email || null,
    volName: vol?.name || "All Volunteers",
    type,
    message: messages[type] || "New alert",
    time: new Date().toLocaleTimeString(),
    read: false,
    userLoc: extra.userLoc || null,
    userPhone: extra.userPhone || null,
  });
  return alertId;
}

// ─────────────────────────────────────────────────────────────────────────
// ACTIVE RESPONSES — bidirectional, CONTINUOUS live location sharing.
// When a volunteer taps "I'm Responding" on an SOS alert, this starts a
// repeating timer that updates their position every 2 seconds, moving
// them steadily toward the user's location (simulated movement for this
// demo — in a real deployment, this tick would instead read the
// volunteer's actual GPS via navigator.geolocation.watchPosition()).
// The user's "Find Nearby Volunteers" screen subscribes to this same
// store, so the volunteer's dot and distance update live, in real time,
// the whole way until they arrive — not just a one-time snapshot.
// ─────────────────────────────────────────────────────────────────────────
let activeResponses = []; // [{ alertId, volId, volName, volPhone, lat, lng, targetLat, targetLng, startedAt, arrived, _timer }]
let responseListeners = [];
function subscribeResponses(fn) {
  responseListeners.push(fn);
  return () => { responseListeners = responseListeners.filter(l => l !== fn); };
}
function notifyResponses() {
  responseListeners.forEach(fn => fn([...activeResponses]));
}

function markResponding(alertId, vol, targetLoc, allVolunteers = []) {
  // One active response per volunteer — replace any previous one and
  // clear its timer first so we never leak intervals.
  const existing = activeResponses.find(r => r.volId === vol.id);
  if (existing && existing._timer) clearInterval(existing._timer);
  activeResponses = activeResponses.filter(r => r.volId !== vol.id);

  const entry = {
    alertId,
    volId: vol.id,
    volName: vol.name,
    volPhone: vol.phone,
    lat: vol.lat,
    lng: vol.lng,
    targetLat: targetLoc?.lat ?? vol.lat,
    targetLng: targetLoc?.lng ?? vol.lng,
    startedAt: new Date().toLocaleTimeString(),
    arrived: false,
    _timer: null,
  };
  activeResponses = [...activeResponses, entry];
  notifyResponses();

  // Notify ALL other approved volunteers that this SOS has been accepted
  // so they know to stand down — they get a distinct "stand down" alert.
  const othersMessage = `${vol.name} has accepted this emergency and is responding. You may stand down.`;
  allVolunteers
    .filter(v => v.approved && v.id !== vol.id)
    .forEach(otherVol => {
      pushAlert({
        id: Date.now() + Math.random(),
        volId: otherVol.id,
        volEmail: otherVol.email,
        volName: otherVol.name,
        type: "standDown",
        message: othersMessage,
        respondingVolName: vol.name,
        respondingVolPhone: vol.phone,
        time: new Date().toLocaleTimeString(),
        read: false,
        userLoc: targetLoc || null,
      });
    });

  // DEMO MODE: simulate the volunteer walking toward the user by
  // stepping ~15% of the remaining distance every 2 seconds. In a real
  // deployment, replace this tick body with the volunteer's actual
  // watchPosition() reading instead of computing a fake step.
  const timer = setInterval(() => {
    const idx = activeResponses.findIndex(r => r.volId === vol.id);
    if (idx === -1) { clearInterval(timer); return; }
    const r = activeResponses[idx];
    if (r.arrived) return;

    const remainingLat = r.targetLat - r.lat;
    const remainingLng = r.targetLng - r.lng;
    const distMeters = haversineMeters(r.lat, r.lng, r.targetLat, r.targetLng);

    if (distMeters < 8) {
      // Close enough — mark arrived and stop moving.
      activeResponses[idx] = { ...r, lat: r.targetLat, lng: r.targetLng, arrived: true };
      clearInterval(timer);
      notifyResponses();
      return;
    }

    activeResponses[idx] = {
      ...r,
      lat: r.lat + remainingLat * 0.15,
      lng: r.lng + remainingLng * 0.15,
    };
    notifyResponses();
  }, 2000);

  // Store the timer handle so stopResponding can clean it up.
  const idx2 = activeResponses.findIndex(r => r.volId === vol.id);
  if (idx2 !== -1) activeResponses[idx2]._timer = timer;
}

function stopResponding(volId) {
  const existing = activeResponses.find(r => r.volId === volId);
  if (existing && existing._timer) clearInterval(existing._timer);
  activeResponses = activeResponses.filter(r => r.volId !== volId);
  notifyResponses();
}

// ─────────────────────────────────────────────────────────────────────────
// SOUND ENGINE — distinct tones per alert type, Web Audio API
// ─────────────────────────────────────────────────────────────────────────
function playEmergencySound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const beep = (freq, start, dur, wave = "square", vol = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.03);
      gain.gain.linearRampToValueAtTime(0, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };
    if (type === "call") {
      [0, 0.28, 0.56, 0.84].forEach((t, i) => beep(i % 2 === 0 ? 880 : 1100, t, 0.24));
    } else if (type === "sos") {
      // Louder, longer, more urgent wail for SOS specifically
      [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((t, i) => beep(i % 2 === 0 ? 700 : 1300, t, 0.18, "sawtooth", 0.4));
    } else {
      [0, 0.18, 0.36].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(1400, now + t);
        osc.frequency.linearRampToValueAtTime(1800, now + t + 0.12);
        gain.gain.setValueAtTime(0.3, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.15);
        osc.start(now + t);
        osc.stop(now + t + 0.18);
      });
    }
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────
// PERSISTENT SESSION (login by college email, survives reinstall via
// localStorage standing in for a real backend-synced session)
// ─────────────────────────────────────────────────────────────────────────
function saveSession(profile) {
  try { localStorage.setItem("aga_session", JSON.stringify(profile)); } catch (e) {}
}
function getSession() {
  try {
    const raw = localStorage.getItem("aga_session");
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function clearSession() {
  try { localStorage.removeItem("aga_session"); } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────
// USER PHONE NUMBER — saved permanently on the device the first time
// they enter it. Never asked again. Sent to volunteers in every SOS/Call
// alert so the volunteer can call the user directly if the map fails.
// ─────────────────────────────────────────────────────────────────────────
function saveUserPhone(phone) {
  try { localStorage.setItem("aga_user_phone", phone); } catch (e) {}
}
function getUserPhone() {
  try { return localStorage.getItem("aga_user_phone") || ""; } catch (e) { return ""; }
}
function hasUserPhone() {
  try { return !!localStorage.getItem("aga_user_phone"); } catch (e) { return false; }
}

// distance helper (Haversine, meters)
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function bearing(lat1, lng1, lat2, lng2) {
  const toRad = d => d * Math.PI / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
// ─────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────
const C = {
  navy: "#0A1628", navyMid: "#122040", navyLight: "#1A3058",
  gold: "#D4A017", red: "#C0392B", white: "#FFFFFF",
  gray: "#94A3B8", green: "#16A34A", blue: "#3B82F6",
};

const S = {
  app: { fontFamily: "'Inter',system-ui,sans-serif", background: C.navy, minHeight: "100vh", color: C.white, maxWidth: 420, margin: "0 auto", position: "relative", overflowX: "hidden" },
  header: { background: C.navyMid, borderBottom: `2px solid ${C.gold}`, padding: "12px 12px 10px" },
  screen: { padding: "20px 16px", paddingBottom: 90 },
  btn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 20px", borderRadius: 10, border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 12, transition: "all 0.15s" },
  btnRed: { background: C.red, color: C.white },
  btnGold: { background: C.gold, color: C.navy },
  btnNavy: { background: C.navyLight, color: C.white, border: `1px solid ${C.gray}` },
  btnSm: { padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  card: { background: C.navyMid, border: `1px solid ${C.navyLight}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 },
  cardGold: { background: C.navyMid, border: `1px solid ${C.gold}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 },
  label: { fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  input: { width: "100%", background: C.navyLight, border: `1px solid ${C.navyLight}`, borderRadius: 8, padding: "10px 12px", color: C.white, fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none" },
  row: { display: "flex", gap: 10, alignItems: "center" },
  badge: ok => ({ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ok ? "#14532d" : "#7f1d1d", color: ok ? "#86efac" : "#fca5a5" }),
  navBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: C.navyMid, borderTop: `2px solid ${C.gold}`, display: "flex", zIndex: 100 },
  navBtn: active => ({ flex: 1, padding: "10px 4px 8px", background: "none", border: "none", color: active ? C.gold : C.gray, fontSize: 9, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
  sHead: { fontSize: 13, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 },
  chip: (sel, val) => ({ padding: "6px 12px", borderRadius: 20, border: `1px solid ${sel===val ? C.gold : C.navyLight}`, background: sel===val ? C.gold : C.navyLight, color: sel===val ? C.navy : C.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6, marginBottom: 6 }),
  statBox: { background: C.navyMid, border: `1px solid ${C.navyLight}`, borderRadius: 12, padding: "14px 10px", textAlign: "center" },
};
// ─────────────────────────────────────────────────────────────────────────
// HEADER — logo slots left/right, title without dot separators, lang toggle
// ─────────────────────────────────────────────────────────────────────────
// NOTE: leftLogo / rightLogo are image URLs. Until the two photos are
// supplied, these render as empty placeholder circles so the layout is
// already correct — just drop in the image URLs once provided.
function Header({ t, lang, onToggleLang, leftLogo, rightLogo }) {
  return (
    <div style={S.header}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button
          onClick={onToggleLang}
          style={{ background: C.navyLight, border: `1px solid ${C.gold}`, borderRadius: 20, padding: "3px 10px", color: C.gold, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
        >
          {lang === "ta" ? "தமிழ் / EN" : "EN / தமிழ்"}
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: leftLogo ? C.white : C.navyLight, border: `1.5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", padding: leftLogo ? 4 : 0, boxSizing: "border-box" }}>
          {leftLogo ? <img src={leftLogo} alt="PSG College of Arts & Science" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 10, color: C.gray }}>LOGO</span>}
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: C.white, letterSpacing: 0.3, margin: 0, lineHeight: 1.2 }}>{t.appTitle}</p>
          <p style={{ fontSize: 9.5, color: C.gold, fontWeight: 600, letterSpacing: 0.5, margin: "2px 0 0" }}>{t.appSubtitle}</p>
          <p style={{ fontSize: 8.5, color: C.gray, margin: "1px 0 0" }}>{t.partnerText}</p>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: rightLogo ? C.white : C.navyLight, border: `1.5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", padding: rightLogo ? 4 : 0, boxSizing: "border-box" }}>
          {rightLogo ? <img src={rightLogo} alt="Alert Golden Army" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 10, color: C.gray }}>LOGO</span>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LOCATION GATE — mandatory, non-skippable, app only works with GPS on
// ─────────────────────────────────────────────────────────────────────────
function LocationGate({ onEnable, denied, t, lang, onToggleLang, leftLogo, rightLogo }) {
  return (
    <div style={{ ...S.app, display: "flex", flexDirection: "column" }}>
      <Header t={t} lang={lang} onToggleLang={onToggleLang} leftLogo={leftLogo} rightLogo={rightLogo} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚨</div>
          <div style={{ background: "#7f1d1d", border: `1px solid ${C.red}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
            <p style={{ color: "#fecaca", fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>{t.locationRequired}</p>
            <p style={{ color: "#fca5a5", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              {denied
                ? t.locationDeniedMsg
                : t.locationRequiredDesc}
            </p>
          </div>
          <button style={{ ...S.btn, ...S.btnGold, marginTop: 24 }} onClick={onEnable}>{t.enableLocation}</button>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// LOGIN — any email ID (college or personal) required before volunteer
// registration. This identity is what survives an uninstall/reinstall:
// log back in with the same email and the profile + volunteer status is
// restored. Only one email can be active per device at a time.
// ─────────────────────────────────────────────────────────────────────────
function LoginScreen({ onLoggedIn, setScreen, t }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  function loginWithEmail(trimmedEmail) {
    // Restore existing profile if this email registered before
    // (simulates "uninstall and reinstall doesn't lose your data").
    const existing = getSession();
    const profile = (existing && existing.email === trimmedEmail)
      ? existing
      : { email: trimmedEmail, registered: false, name: "", approved: false };
    saveSession(profile);
    onLoggedIn(profile);
  }

  function handleLogin() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError(t.emailError);
      return;
    }
    loginWithEmail(trimmed);
  }

  function handleGoogleLogin() {
    // DEMO MODE: simulates a Google account picker. A real deployment
    // would use Firebase Auth / Google OAuth here and receive a verified
    // email back from Google. For this demo, we ask once and reuse it
    // like a real Google session would.
    const existing = getSession();
    if (existing && existing.email) {
      loginWithEmail(existing.email);
      return;
    }
    const demoEmail = window.prompt("Demo Google Sign-In — enter the Google account email to simulate:");
    if (!demoEmail || !demoEmail.includes("@")) return;
    loginWithEmail(demoEmail.trim().toLowerCase());
  }

  return (
    <div style={S.screen}>
      <div style={S.sHead}>🔑 Volunteer Login</div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <p style={{ color: C.gray, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
          Log in first — this keeps your volunteer profile safe. Even if you uninstall and reinstall the app, logging in again with the same account restores everything: your details, your approval status, all of it.
        </p>
      </div>

      <button
        style={{ ...S.btn, background: C.white, color: "#1F2937", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
        onClick={handleGoogleLogin}
      >
        <span style={{ fontSize: 18 }}>🔵</span> Continue with Google
      </button>

      {!showEmailForm ? (
        <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => setShowEmailForm(true)}>
          ✉️ Continue with Email
        </button>
      ) : (
        <>
          <p style={S.label}>Email ID *</p>
          <input style={S.input} type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => { setEmail(e.target.value); setError(""); }} />
          {error && <p style={{ color: "#fca5a5", fontSize: 12, marginTop: -6, marginBottom: 12 }}>{error}</p>}
          <button style={{ ...S.btn, ...S.btnGold }} onClick={handleLogin}>Continue</button>
        </>
      )}

      <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => setScreen("home")}>Cancel</button>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// HOME SCREEN — SOS button, dashboard stats, navigation entry points.
// Only reachable once location is enabled (gate handles that upstream).
// ─────────────────────────────────────────────────────────────────────────
function HomeScreen({ userLoc, setScreen, t, onSOS, volunteers, sosCountToday, casesHandled }) {
  const activeCount = volunteers.filter(v => v.approved && v.online && v.availability).length;
  const totalCount = volunteers.filter(v => v.approved).length;

  return (
    <div style={S.screen}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ color: C.gray, fontSize: 12, margin: 0 }}>📍 Location active — ready to assist</p>
      </div>

      {/* SOS — the primary action, large and unmistakable */}
      <button
        onClick={onSOS}
        style={{
          ...S.btn, background: C.red, color: C.white, fontSize: 20, fontWeight: 800,
          padding: "22px 20px", borderRadius: 16, boxShadow: "0 0 24px rgba(192,57,43,0.5)",
          letterSpacing: 1, marginBottom: 16,
        }}
      >
        🚨 {t.sosButton}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flexDirection: "column", padding: "16px 8px", gap: 4 }} onClick={() => setScreen("volunteers")}>
          <span style={{ fontSize: 22 }}>🆘</span>
          <span style={{ fontSize: 12 }}>{t.findMembers}</span>
        </button>
        <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flexDirection: "column", padding: "16px 8px", gap: 4 }} onClick={() => setScreen("contacts")}>
          <span style={{ fontSize: 22 }}>📞</span>
          <span style={{ fontSize: 12 }}>{t.emergencyContacts}</span>
        </button>
        <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flexDirection: "column", padding: "16px 8px", gap: 4 }} onClick={() => setScreen("campusMap")}>
          <span style={{ fontSize: 22 }}>🗺️</span>
          <span style={{ fontSize: 12 }}>{t.campusMap}</span>
        </button>
        <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flexDirection: "column", padding: "16px 8px", gap: 4 }} onClick={() => setScreen("login")}>
          <span style={{ fontSize: 22 }}>📝</span>
          <span style={{ fontSize: 12 }}>{t.registerVolunteer}</span>
        </button>
        <button style={{ ...S.btn, background: "#7C1D1D", color: C.white, marginBottom: 0, flexDirection: "column", padding: "16px 8px", gap: 4, gridColumn: "span 2" }} onClick={() => setScreen("firstAid")}>
          <span style={{ fontSize: 22 }}>🩺</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{t.firstAidGuide}</span>
        </button>
      </div>

      {/* Live dashboard stats */}
      <div style={S.sHead}>📊 Dashboard</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div style={S.statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.gold, margin: 0 }}>{totalCount}</p>
          <p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>{t.totalVolunteers}</p>
        </div>
        <div style={S.statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.green, margin: 0 }}>{activeCount}</p>
          <p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>{t.activeVolunteers}</p>
        </div>
        <div style={S.statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: C.red, margin: 0 }}>{sosCountToday}</p>
          <p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>{t.sosToday}</p>
        </div>
        <div style={S.statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#60A5FA", margin: 0 }}>{casesHandled}</p>
          <p style={{ fontSize: 11, color: C.gray, margin: "4px 0 0" }}>{t.casesHandled}</p>
        </div>
      </div>

      {userLoc && (
        <div style={{ ...S.card, textAlign: "center", marginTop: 8 }}>
          <p style={{ color: C.gold, fontWeight: 700, fontSize: 11, margin: "0 0 4px" }}>YOUR LOCATION</p>
          <p style={{ color: C.white, fontSize: 13, margin: 0 }}>{userLoc.lat.toFixed(4)}, {userLoc.lng.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// FIND MEMBERS — nearby volunteers, exact distance, call + view map.
// Header uses 🆘 (alert/SOS emoji) instead of a magnifying glass, as
// requested, so it's immediately recognizable as an emergency action.
// Calling a volunteer ALSO shares the user's current location with them
// (carried in the alert payload) — not just a notification that someone
// called, but exactly where that someone is.
// ─────────────────────────────────────────────────────────────────────────
function VolunteersScreen({ userLoc, setScreen, setSelectedVol, volunteers, t }) {
  const [filter, setFilter] = useState("all");
  const [responses, setResponses] = useState([...activeResponses]);

  useEffect(() => subscribeResponses(r => setResponses([...r])), []);

  const withDistance = volunteers
    .filter(v => v.approved)
    .map(v => {
      const myResponse = responses.find(r => r.volId === v.id);
      // While responding, use the continuously-updating live position
      // from activeResponses (which moves every 2s) instead of the
      // volunteer's static registered lat/lng — this is what makes the
      // distance and dot actually move on the user's screen in real time.
      const liveLat = myResponse ? myResponse.lat : v.lat;
      const liveLng = myResponse ? myResponse.lng : v.lng;
      return {
        ...v,
        lat: liveLat,
        lng: liveLng,
        distance: userLoc && liveLat && liveLng ? haversineMeters(userLoc.lat, userLoc.lng, liveLat, liveLng) : v.distance,
        isResponding: !!myResponse,
        hasArrived: myResponse?.arrived || false,
        respondingSince: myResponse?.startedAt || null,
      };
    })
    .filter(v => v.distance <= CAMPUS_RADIUS_KM * 1000);

  const displayed = withDistance
    .filter(v => filter === "available" ? (v.availability && v.online) : filter === "certified" ? v.first_aid_certified : true)
    .sort((a, b) => {
      // Responders to an active SOS always float to the top.
      if (a.isResponding !== b.isResponding) return a.isResponding ? -1 : 1;
      return a.distance - b.distance;
    });

  function callVol(vol) {
    // 1. Phone dialer opens instantly — number goes straight to dial pad.
    window.location.href = `tel:${vol.phone}`;
    // 2. Volunteer gets an alert AND the caller's exact current location.
    sendVolunteerAlert(vol, "call", { userLoc, userPhone: getUserPhone() });
    playEmergencySound("call");
  }

  function viewMap(vol) {
    sendVolunteerAlert(vol, "map", { userLoc });
    playEmergencySound("map");
    setSelectedVol(vol);
    setScreen("map");
  }

  function formatDistance(m) {
    return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
  }

  return (
    <div style={S.screen}>
      <div style={S.sHead}>🆘 Nearby Volunteers</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 14 }}>{t.nearbySubtitle}</p>
      <div style={{ marginBottom: 16 }}>
        {["all", "available", "certified"].map(f => (
          <button key={f} style={S.chip(filter, f)} onClick={() => setFilter(f)}>
            {f === "all" ? t.filterAll : f === "available" ? t.filterAvailable : t.filterCertified}
          </button>
        ))}
      </div>
      {displayed.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
          <p style={{ color: C.gray, fontSize: 13 }}>{t.noVolunteers}</p>
        </div>
      )}
      {displayed.map(vol => (
        <div key={vol.id} style={vol.isResponding ? { ...S.cardGold, border: `2px solid ${C.green}`, background: "#0d2818" } : S.cardGold}>
          {vol.isResponding && (
            <div style={{ marginBottom: 10, background: vol.hasArrived ? "rgba(212,160,23,0.18)" : "rgba(22,163,74,0.15)", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: vol.hasArrived ? 0 : 6 }}>
                <span style={{ fontSize: 14 }}>{vol.hasArrived ? "✅" : "🏃"}</span>
                <p style={{ color: vol.hasArrived ? C.gold : "#86efac", fontSize: 11, fontWeight: 700, margin: 0, flex: 1 }}>
                  {vol.hasArrived ? t.arrived : `${t.respondingSince} ${vol.respondingSince}`}
                </p>
                {!vol.hasArrived && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#86efac", flexShrink: 0 }} />}
              </div>
              {/* Show volunteer phone explicitly so user can call directly
                  even if the map or app has any issue */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <p style={{ color: "#fbbf24", fontSize: 11, margin: 0, flex: 1 }}>📞 {vol.phone}</p>
                <button
                  style={{ ...S.btnSm, background: C.red, color: C.white, padding: "4px 10px", fontSize: 11 }}
                  onClick={() => window.location.href = `tel:${vol.phone}`}
                >Call Now</button>
              </div>
            </div>
          )}
          <div style={{ ...S.row, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: vol.isResponding ? C.green : C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: vol.isResponding ? C.white : C.navy, flexShrink: 0 }}>
              {vol.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p>
              <p style={{ fontSize: 12, color: C.gray, margin: "2px 0 0" }}>{vol.department || vol.occupation} {vol.year ? `· ${vol.year}` : ""}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: vol.isResponding ? "#86efac" : C.gold, margin: 0 }}>{formatDistance(vol.distance)}</p>
              <p style={{ fontSize: 12, color: C.gray }}>away</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={S.badge(vol.online)}>{vol.online ? t.online : t.offline}</span>
            <span style={S.badge(vol.availability)}>{vol.availability ? t.filterAvailable : "Unavailable"}</span>
            <span style={S.badge(vol.first_aid_certified)}>{vol.first_aid_certified ? t.certified : t.notCertified}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btn, ...S.btnRed, marginBottom: 0, flex: 1, padding: "10px 12px", fontSize: 13 }} onClick={() => callVol(vol)}>
              📞 Call Now
            </button>
            <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flex: 1, padding: "10px 12px", fontSize: 13 }} onClick={() => viewMap(vol)}>
              🗺 View Map
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// MAP SCREEN — uses OpenStreetMap (free, no API key, no billing account)
// via a static export image + an in-app position visual for exact
// distance/direction. Tapping Navigate opens full OSM directions in a
// new tab — completely free, no Google Maps dependency at all.
// ─────────────────────────────────────────────────────────────────────────
function MapScreen({ userLoc, selectedVol, setScreen, t }) {
  const [responses, setResponses] = useState([...activeResponses]);
  useEffect(() => subscribeResponses(r => setResponses([...r])), []);

  const baseVol = selectedVol || MOCK_VOLUNTEERS[0];
  const liveResponse = responses.find(r => r.volId === baseVol.id);
  // If this volunteer is actively responding, always show their live,
  // continuously-updating position instead of the static one passed in.
  const vol = liveResponse ? { ...baseVol, lat: liveResponse.lat, lng: liveResponse.lng } : baseVol;
  const isLive = !!liveResponse && !liveResponse.arrived;

  const uLat = userLoc?.lat || CAMPUS_CENTER.lat;
  const uLng = userLoc?.lng || CAMPUS_CENTER.lng;
  const exactDist = vol.lat && vol.lng ? haversineMeters(uLat, uLng, vol.lat, vol.lng) : vol.distance;
  const walkMin = Math.max(1, Math.round(exactDist / 80));
  const distLabel = `${Math.round(exactDist)}m`;
  const deg = vol.lat && vol.lng ? bearing(uLat, uLng, vol.lat, vol.lng) : 0;

  // OpenStreetMap directions — free, no key, opens in browser/app
  const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${uLat}%2C${uLng}%3B${vol.lat}%2C${vol.lng}`;

  return (
    <div style={S.screen}>
      <button style={{ ...S.btnSm, ...S.btnNavy, marginBottom: 16, width: "auto" }} onClick={() => setScreen("volunteers")}>← Back</button>
      <div style={S.sHead}>🗺 Volunteer Location</div>
      {isLive && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(22,163,74,0.15)", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#86efac", flexShrink: 0 }} />
          <p style={{ color: "#86efac", fontSize: 12, fontWeight: 700, margin: 0 }}>Live — updating every 2 seconds as they move toward you</p>
        </div>
      )}
      {liveResponse?.arrived && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(212,160,23,0.18)", borderRadius: 10, padding: "8px 12px", marginBottom: 14 }}>
          <span style={{ fontSize: 14 }}>✅</span>
          <p style={{ color: C.gold, fontSize: 12, fontWeight: 700, margin: 0 }}>{t.arrived}</p>
        </div>
      )}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={S.row}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: C.navy }}>
            {vol.name.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p>
            <p style={{ fontSize: 12, color: C.gray, margin: "2px 0 0" }}>{vol.department || vol.occupation}</p>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[{ icon: "📍", label: t.exactDistance, val: distLabel }, { icon: "🚶", label: t.walkTime, val: `~${walkMin} min` }].map(m => (
          <div key={m.label} style={{ ...S.card, flex: 1, textAlign: "center", marginBottom: 0 }}>
            <p style={{ fontSize: 20, margin: "0 0 4px" }}>{m.icon}</p>
            <p style={{ color: C.gold, fontWeight: 800, fontSize: 18, margin: 0 }}>{m.val}</p>
            <p style={{ color: C.gray, fontSize: 11, margin: 0 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Free position visual — no external API/key needed */}
      <div style={{ background: C.navyLight, borderRadius: 12, height: 220, marginBottom: 12, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(212,160,23,0.15) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        {[1, 2, 3].map(r => (
          <div key={r} style={{ position: "absolute", top: "50%", left: "50%", width: r * 56, height: r * 56, marginLeft: -(r * 28), marginTop: -(r * 28), border: `1px solid rgba(148,163,184,${0.35 - r * 0.08})`, borderRadius: "50%" }} />
        ))}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.blue, border: `2px solid ${C.white}`, margin: "0 auto" }} />
          <p style={{ fontSize: 10, color: C.gray, margin: "4px 0 0" }}>You</p>
        </div>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: `rotate(${deg}deg) translateY(-78px) rotate(${-deg}deg) translate(-50%,-50%)`,
          textAlign: "center",
        }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: C.gold, border: `2px solid ${C.navy}`, margin: "0 auto", boxShadow: "0 0 8px rgba(212,160,23,0.8)" }} />
          <p style={{ fontSize: 10, color: C.gold, fontWeight: 700, margin: "4px 0 0", whiteSpace: "nowrap" }}>{vol.name.split(" ")[0]} · {distLabel}</p>
        </div>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 0, height: 0, marginLeft: -6, marginTop: -34,
          transform: `rotate(${deg}deg)`, transformOrigin: "6px 34px",
          borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: `12px solid ${C.gold}`,
        }} />
      </div>
      <p style={{ fontSize: 11, color: C.gray, textAlign: "center", marginBottom: 16 }}>
        Free map via OpenStreetMap — no Google Maps fees. Tap Navigate for full directions.
      </p>
      {/* Show volunteer phone explicitly — if map or navigation fails,
          user can still call the volunteer directly from this screen */}
      <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>📞</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.gold, fontWeight: 700, fontSize: 11, margin: "0 0 2px" }}>VOLUNTEER'S PHONE</p>
          <p style={{ color: C.white, fontSize: 14, fontWeight: 700, margin: 0 }}>{vol.phone}</p>
        </div>
        <button
          style={{ ...S.btnSm, background: C.red, color: C.white, padding: "8px 14px" }}
          onClick={() => window.location.href = `tel:${vol.phone}`}
        >Call Now</button>
      </div>
      <button style={{ ...S.btn, ...S.btnGold }} onClick={() => window.open(osmUrl, "_blank")}>🧭 Navigate to Volunteer</button>
      <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => window.location.href = `tel:${vol.phone}`}>📞 Call {vol.name.split(" ")[0]} Directly</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CAMPUS MAP — landmark overview using free OpenStreetMap embed (no key)
// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// FIRST AID GUIDE — Emergency Basic First Aid Techniques.
// All 13 sections shown in a clean readable format.
// Admin can edit the content anytime from Admin → Guide tab.
// ─────────────────────────────────────────────────────────────────────────
const DEFAULT_FIRST_AID_GUIDE = [
  {
    id: 1, title: "1. Basic Life Support (BLS)", icon: "🫀",
    steps: [
      { heading: "Step 1: Ensure Scene Safety", points: ["Check that the area is safe for you and the victim.", "Look for fire, electricity, traffic, water, or other dangers."] },
      { heading: "Step 2: Check Responsiveness", points: ["Gently tap the person's shoulders.", 'Ask loudly: "Are you okay?"'] },
      { heading: "Step 3: Call for Help", points: ["Ask someone to call an ambulance immediately.", "If alone, call emergency services yourself."] },
      { heading: "Step 4: Check Breathing", points: ["Open the airway using the Head Tilt–Chin Lift method.", "Look, listen, and feel for breathing for 10 seconds."] },
      { heading: "Step 5: Act According to the Situation", points: ["If breathing normally → Place in Recovery Position.", "If not breathing → Start CPR immediately."] },
    ]
  },
  {
    id: 2, title: "2. Recovery Position", icon: "🔄",
    steps: [
      { heading: "When to Use", points: ["For an unconscious person who is breathing normally."] },
      { heading: "Steps", points: ["Kneel beside the victim.", "Place the nearest arm at a right angle.", "Bring the far arm across the chest.", "Bend the far knee upward.", "Carefully roll the person onto their side.", "Tilt the head slightly backward to keep the airway open.", "Monitor breathing until help arrives."] },
    ]
  },
  {
    id: 3, title: "3. CPR", icon: "🫁",
    steps: [
      { heading: "When to Use", points: ["If the victim is unconscious and not breathing."] },
      { heading: "Chest Compressions", points: ["Place heel of one hand in center of chest.", "Place second hand on top, interlock fingers.", "Keep arms straight, shoulders above hands.", "Push hard and fast — 30 compressions per cycle.", "Rate: 100–120 per minute. Depth: ~5 cm (2 inches)."] },
      { heading: "Rescue Breathing", points: ["Open airway using Head Tilt–Chin Lift.", "Pinch nose closed. Cover mouth with yours.", "Give 2 breaths. Watch for chest rise."] },
      { heading: "CPR Cycle", points: ["30 compressions → 2 breaths → Repeat until help arrives."] },
    ]
  },
  {
    id: 4, title: "4. Choking", icon: "😮‍💨",
    steps: [
      { heading: "Signs", points: ["Unable to speak", "Difficulty breathing", "Hands clutching throat"] },
      { heading: "Steps", points: ["Encourage coughing if possible.", "Stand behind the victim.", "Place fist above the navel.", "Hold fist with other hand.", "Give quick upward thrusts.", "Continue until object is expelled or help arrives."] },
    ]
  },
  {
    id: 5, title: "5. Fractures", icon: "🦴",
    steps: [
      { heading: "Steps", points: ["Keep the injured area still.", "Do not attempt to straighten the bone.", "Apply ice pack wrapped in cloth.", "Support with a sling or splint.", "Seek medical attention immediately."] },
    ]
  },
  {
    id: 6, title: "6. Severe Bleeding", icon: "🩸",
    steps: [
      { heading: "Steps", points: ["Wear gloves if available.", "Apply direct pressure to the wound.", "Elevate injured part above heart level if possible.", "Cover with a clean bandage.", "Continue pressure until bleeding stops.", "Call emergency services if bleeding is severe."] },
    ]
  },
  {
    id: 7, title: "7. Drowning", icon: "🌊",
    steps: [
      { heading: "Steps", points: ["Remove the victim from water safely.", "Call emergency services.", "Check breathing.", "If breathing → Recovery Position.", "If not breathing → Start CPR.", "Continue until medical help arrives."] },
    ]
  },
  {
    id: 8, title: "8. Burns", icon: "🔥",
    steps: [
      { heading: "Minor Burns", points: ["Remove person from heat source.", "Cool burn with running tap water for 20 minutes.", "Remove tight jewelry carefully.", "Cover with a sterile dressing."] },
      { heading: "If Clothing is on Fire — STOP DROP ROLL", points: ["STOP moving.", "DROP to the ground.", "ROLL repeatedly until flames are extinguished."] },
      { heading: "Do NOT", points: ["Apply toothpaste, butter, or oil.", "Break blisters."] },
    ]
  },
  {
    id: 9, title: "9. Seizures (Fits)", icon: "⚡",
    steps: [
      { heading: "Steps", points: ["Stay calm.", "Move dangerous objects away.", "Cushion the head.", "Loosen tight clothing.", "Do not restrain the person.", "Do not place anything in the mouth.", "Time the seizure.", "After seizure stops, place in Recovery Position.", "Call ambulance if seizure lasts more than 5 minutes."] },
    ]
  },
  {
    id: 10, title: "10. Heart Attack", icon: "❤️",
    steps: [
      { heading: "Common Symptoms", points: ["Chest pain", "Sweating", "Shortness of breath", "Pain in arm, jaw, neck, or back"] },
      { heading: "Steps", points: ["Call emergency services immediately.", "Make the person sit comfortably.", "Loosen tight clothing.", "Keep the person calm.", "Do not give food or drinks.", "If person becomes unconscious and stops breathing, start CPR."] },
    ]
  },
  {
    id: 11, title: "11. Snake Bite", icon: "🐍",
    steps: [
      { heading: "Steps", points: ["Keep the victim calm.", "Wash the bite area gently.", "Keep bitten limb below heart level.", "Remove tight items such as rings.", "Call emergency services.", "Transport to hospital immediately."] },
      { heading: "Do NOT", points: ["Cut the wound", "Suck the venom", "Apply ice"] },
    ]
  },
  {
    id: 12, title: "12. Dog Bite", icon: "🐕",
    steps: [
      { heading: "Steps", points: ["Wash wound with running water for several minutes.", "Clean with soap.", "Cover with a sterile dressing.", "Visit a hospital immediately.", "Assess rabies vaccination status if possible."] },
    ]
  },
  {
    id: 13, title: "13. Fire Emergency Safety", icon: "🚒",
    steps: [
      { heading: "Steps", points: ["Activate fire alarm if available.", "Leave the area immediately.", "Use stairs, not elevators.", "Crawl below smoke level.", "Cover nose and mouth with a wet cloth.", "Close doors behind you.", "Move to a safe assembly point."] },
      { heading: "Do NOT", points: ["Use lifts", "Open hot doors", "Jump from windows unless absolutely necessary"] },
    ]
  },
];

function getFirstAidGuide() {
  try {
    const raw = localStorage.getItem("aga_first_aid_guide");
    return raw ? JSON.parse(raw) : DEFAULT_FIRST_AID_GUIDE;
  } catch (e) { return DEFAULT_FIRST_AID_GUIDE; }
}
function saveFirstAidGuide(guide) {
  try { localStorage.setItem("aga_first_aid_guide", JSON.stringify(guide)); } catch (e) {}
}

function FirstAidGuideScreen({ setScreen, canEdit = false, t }) {
  const [guide, setGuide] = useState(() => getFirstAidGuide());
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  function startEdit(section) {
    setEditing(section.id);
    setEditTitle(section.title);
    setEditContent(section.steps.map(s =>
      `## ${s.heading}\n${s.points.join("\n")}`
    ).join("\n\n"));
  }

  function saveEdit() {
    const updatedGuide = guide.map(s => {
      if (s.id !== editing) return s;
      const blocks = editContent.split(/\n## /).map((b, i) => i === 0 ? b.replace(/^## /, "") : b);
      const steps = blocks.filter(Boolean).map(block => {
        const lines = block.split("\n").filter(Boolean);
        return { heading: lines[0], points: lines.slice(1) };
      });
      return { ...s, title: editTitle, steps };
    });
    setGuide(updatedGuide);
    saveFirstAidGuide(updatedGuide);
    setEditing(null);
  }

  return (
    <div style={S.screen}>
      <div style={S.sHead}>{t.firstAidTitle}</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 16 }}>
        {t.firstAidSubtitle}
      </p>

      {/* Quick index */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {guide.map(s => (
          <button key={s.id}
            style={{ padding: "4px 10px", borderRadius: 16, border: `1px solid ${C.navyLight}`, background: C.navyLight, color: C.gray, fontSize: 11, cursor: "pointer" }}
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
          >{s.icon}</button>
        ))}
      </div>

      {guide.map(section => (
        <div key={section.id} style={{ ...S.card, marginBottom: 10 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={() => setExpanded(expanded === section.id ? null : section.id)}
          >
            <span style={{ fontSize: 22 }}>{section.icon}</span>
            <p style={{ flex: 1, fontWeight: 700, fontSize: 14, color: C.white, margin: 0 }}>{section.title}</p>
            {canEdit && (
              <button
                style={{ ...S.btnSm, background: C.navyLight, color: C.gold, padding: "4px 10px", fontSize: 11 }}
                onClick={(e) => { e.stopPropagation(); startEdit(section); }}
              >✏️ Edit</button>
            )}
            <span style={{ color: C.gray, fontSize: 16 }}>{expanded === section.id ? "▲" : "▼"}</span>
          </div>

          {expanded === section.id && (
            <div style={{ marginTop: 12 }}>
              {section.steps.map((step, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <p style={{ color: C.gold, fontWeight: 700, fontSize: 12, margin: "0 0 6px" }}>{step.heading}</p>
                  {step.points.map((point, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ color: C.gold, fontSize: 11, flexShrink: 0, marginTop: 1 }}>•</span>
                      <p style={{ color: C.white, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{point}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {editing && canEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, overflowY: "auto" }}>
          <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, width: "100%", maxWidth: 380, marginTop: 16 }}>
            <p style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>{t.editSection}</p>
            <p style={S.label}>{t.sectionTitle}</p>
            <input style={S.input} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            <p style={S.label}>{t.contentLabel}</p>
            <p style={{ color: C.gray, fontSize: 10, marginTop: -8, marginBottom: 8 }}>
              {t.contentHint}
            </p>
            <textarea
              style={{ ...S.input, minHeight: 200, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn, ...S.btnNavy, flex: 1, marginBottom: 0 }} onClick={() => setEditing(null)}>Cancel</button>
              <button style={{ ...S.btn, ...S.btnGold, flex: 1, marginBottom: 0 }} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CAMPUS MAP — landmark overview using free OpenStreetMap visual
// ─────────────────────────────────────────────────────────────────────────
function CampusMapScreen({ setScreen, t }) {
  // Positions each landmark on a simple top-down grid relative to campus
  // center — purely illustrative, but renders reliably everywhere since
  // there's zero dependency on an external iframe (which was getting
  // blocked by CSP in the preview environment, showing "Webpage not
  // available"). Tapping "Open in Maps" still gives a real, accurate
  // OpenStreetMap link that opens in the browser/app — free, no API key.
  function gridPos(loc) {
    const dx = (loc.lng - CAMPUS_CENTER.lng) / 0.006; // -1..1 roughly
    const dy = (loc.lat - CAMPUS_CENTER.lat) / 0.004;
    const left = 50 + dx * 38; // percent
    const top = 50 - dy * 38;
    return { left: `${Math.max(8, Math.min(92, left))}%`, top: `${Math.max(8, Math.min(92, top))}%` };
  }

  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${CAMPUS_CENTER.lat}&mlon=${CAMPUS_CENTER.lng}#map=17/${CAMPUS_CENTER.lat}/${CAMPUS_CENTER.lng}`;

  return (
    <div style={S.screen}>
      <button style={{ ...S.btnSm, ...S.btnNavy, marginBottom: 16, width: "auto" }} onClick={() => setScreen("home")}>{t.backBtn}</button>
      <div style={S.sHead}>🗺️ Campus Map</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 14 }}>PSG College of Arts & Science, Coimbatore</p>

      {/* Self-contained campus layout visual — no external map service
          dependency, so it always renders. */}
      <div style={{ background: C.navyLight, borderRadius: 12, height: 280, marginBottom: 12, position: "relative", overflow: "hidden", border: `1px solid ${C.navyLight}` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(212,160,23,0.12) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        {/* campus boundary */}
        <div style={{ position: "absolute", top: "8%", left: "8%", right: "8%", bottom: "8%", border: `2px dashed rgba(212,160,23,0.35)`, borderRadius: 16 }} />
        <p style={{ position: "absolute", top: 8, left: 12, fontSize: 9, color: C.gray, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>PSGCAS Campus</p>

        {CAMPUS_LANDMARKS.map(loc => {
          const pos = gridPos(loc);
          return (
            <div key={loc.name} style={{ position: "absolute", ...pos, transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 0 6px rgba(212,160,23,0.6)" }}>
                {loc.icon}
              </div>
              <p style={{ fontSize: 8.5, color: C.white, margin: "3px 0 0", whiteSpace: "nowrap", background: "rgba(10,22,40,0.7)", borderRadius: 4, padding: "1px 4px" }}>{loc.name}</p>
            </div>
          );
        })}
      </div>

      <button style={{ ...S.btn, ...S.btnGold }} onClick={() => window.open(fullMapUrl, "_blank")}>🌍 Open Full Map (OpenStreetMap)</button>

      <div style={S.sHead}>📍 Key Locations</div>
      {CAMPUS_LANDMARKS.map(loc => (
        <div key={loc.name} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{loc.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: 0 }}>{loc.name}</p>
            <p style={{ fontSize: 11, color: C.gray, margin: "2px 0 0" }}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p>
          </div>
          <button
            style={{ ...S.btnSm, background: C.navyLight, color: C.gold }}
            onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=18/${loc.lat}/${loc.lng}`, "_blank")}
          >
            Open
          </button>
        </div>
      ))}
      <div style={{ ...S.card, marginTop: 4 }}>
        <p style={{ color: C.gold, fontWeight: 700, fontSize: 12, margin: "0 0 6px" }}>COMING SOON</p>
        <p style={{ color: C.gray, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
          Live volunteer locations, real-time navigation, and route guidance to emergency assembly points.
        </p>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// EMERGENCY CONTACTS — visible to everyone, anyone can tap to call.
// canEdit=true (admin only) additionally shows edit/delete icons and an
// "Add Contact" button so admin can manage the full list.
// ─────────────────────────────────────────────────────────────────────────
function ContactsScreen({ canEdit = false, embedded = false, t }) {
  const [contacts, setContacts] = useState(() => {
    try {
      const raw = localStorage.getItem("emergency_contacts");
      return raw ? JSON.parse(raw) : DEFAULT_CONTACTS;
    } catch (e) { return DEFAULT_CONTACTS; }
  });
  const [editingKey, setEditingKey] = useState(null);
  const [editIcon, setEditIcon] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [adding, setAdding] = useState(false);

  function persist(next) {
    setContacts(next);
    try { localStorage.setItem("emergency_contacts", JSON.stringify(next)); } catch (e) {}
  }

  function startEdit(c) {
    setEditingKey(c.key);
    setEditIcon(c.icon);
    setEditLabel(c.label);
    setEditNumber(c.number);
    setEditDesc(c.desc);
    setAdding(false);
  }

  function startAdd() {
    setEditingKey("__new__");
    setEditIcon("📞");
    setEditLabel("");
    setEditNumber("");
    setEditDesc("");
    setAdding(true);
  }

  function saveEdit() {
    if (!editLabel.trim() || !editNumber.trim()) return;
    if (adding) {
      const newContact = { key: `custom-${Date.now()}`, icon: editIcon || "📞", label: editLabel, number: editNumber, desc: editDesc };
      persist([...contacts, newContact]);
    } else {
      persist(contacts.map(c => c.key === editingKey ? { ...c, icon: editIcon, label: editLabel, number: editNumber, desc: editDesc } : c));
    }
    setEditingKey(null);
  }

  function deleteContact(key) {
    if (window.confirm("Remove this emergency contact?")) {
      persist(contacts.filter(c => c.key !== key));
    }
  }

  const wrapperStyle = embedded ? {} : S.screen;

  return (
    <div style={wrapperStyle}>
      <div style={S.sHead}>📞 Emergency Contacts</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 16 }}>
        {canEdit ? t.contactsAdminNote : t.contactsUserNote}
      </p>
      {contacts.map(c => (
        <div key={c.key} style={{ background: C.red, borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26, cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>{c.icon}</span>
          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.white, margin: 0 }}>{c.label}</p>
            <p style={{ fontSize: 12, color: "#fecaca", margin: 0 }}>{c.desc}</p>
          </div>
          <div style={{ textAlign: "right", cursor: "pointer" }} onClick={() => window.open(`tel:${c.number}`, "_self")}>
            <p style={{ fontSize: 14, color: "#fecaca", fontWeight: 800, margin: 0 }}>{c.number}</p>
            <p style={{ fontSize: 10, color: "#fca5a5", margin: 0 }}>Tap to call</p>
          </div>
          {canEdit && (
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: C.white, fontSize: 13 }} onClick={() => startEdit(c)}>✏️</button>
              <button style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: C.white, fontSize: 13 }} onClick={() => deleteContact(c.key)}>🗑️</button>
            </div>
          )}
        </div>
      ))}

      {canEdit && (
        <button style={{ ...S.btn, ...S.btnNavy }} onClick={startAdd}>➕ Add Emergency Contact</button>
      )}

      {canEdit && editingKey && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div style={{ background: C.navyMid, borderRadius: 14, padding: 20, width: "100%", maxWidth: 340 }}>
            <p style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              {adding ? t.addNewContact : `Edit ${contacts.find(c => c.key === editingKey)?.label}`}
            </p>
            <p style={S.label}>Icon (emoji)</p>
            <input style={S.input} value={editIcon} onChange={e => setEditIcon(e.target.value)} placeholder="🚑" />
            <p style={S.label}>Label</p>
            <input style={S.input} value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="e.g. Hostel Warden" />
            <p style={S.label}>Phone Number</p>
            <input style={S.input} value={editNumber} onChange={e => setEditNumber(e.target.value)} />
            <p style={S.label}>Description</p>
            <input style={S.input} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0, flex: 1 }} onClick={() => setEditingKey(null)}>Cancel</button>
              <button style={{ ...S.btn, ...S.btnGold, marginBottom: 0, flex: 1 }} onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {!canEdit && (
        <div style={S.card}>
          <p style={{ color: C.gold, fontWeight: 700, fontSize: 12, margin: "0 0 6px" }}>NOTE</p>
          <p style={{ color: C.gray, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
            These numbers are managed by the Admin team. If a number is incorrect, please report it through the College Help Desk.
          </p>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// VOLUNTEER REGISTRATION / EDIT — only reachable after login.
// Mandatory: Full Name, Email ID (any — college or personal), Phone Number,
// First Aid Training Details, First Aid Certified (Yes/No).
// Optional: Roll Number, Department, Year of Study, Occupation, Remarks.
// t.occupation lets non-students (doctors, staff, etc.) from
// the wider community register too.
//
// Same form doubles as the EDIT screen: if existingRecord is passed in,
// the fields are pre-filled with the volunteer's saved details and
// t.submitApplication becomes t.saveChanges — they can fix a typo or
// add their department/year any time, even after approval.
// ─────────────────────────────────────────────────────────────────────────
function RegisterScreen({ setScreen, session, onRegistered, existingRecord, onUpdate, t }) {
  const isEdit = !!existingRecord;
  const seed = existingRecord || {};
  const [form, setForm] = useState({
    name: seed.name || session?.name || "",
    email: seed.email || session?.email || "",
    roll: seed.roll || "",
    phone: seed.phone || "",
    department: seed.department || "",
    year: seed.year || "",
    occupation: seed.occupation || "",
    first_aid_trained: seed.first_aid_trained ?? null,
    first_aid_certified: seed.first_aid_certified ?? null,
    remarks: seed.remarks || seed.training_details || "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function update(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: null }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = t.nameError;
    if (!form.email.trim() || !form.email.includes("@")) e.email = t.emailError2;
    if (!form.phone.trim()) e.phone = t.phoneError;
    if (!form.remarks.trim()) e.remarks = t.remarksError;
    if (form.first_aid_certified === null) e.first_aid_certified = t.certError;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    if (isEdit) {
      // Editing an existing record — only the editable fields change,
      // approval status and ID are untouched.
      onUpdate({
        ...existingRecord,
        name: form.name,
        email: form.email,
        roll: form.roll,
        phone: form.phone,
        department: form.department,
        year: form.year,
        occupation: form.occupation,
        first_aid_trained: form.first_aid_trained,
        first_aid_certified: form.first_aid_certified,
        remarks: form.remarks,
      });
      const updatedSession = { ...session, name: form.name, email: form.email };
      saveSession(updatedSession);
      setLoading(false);
      setSaved(true);
      return;
    }

    const profile = {
      ...session,
      registered: true,
      approved: false,
      name: form.name,
      email: form.email,
      roll: form.roll,
      phone: form.phone,
      department: form.department,
      year: form.year,
      occupation: form.occupation,
      first_aid_trained: form.first_aid_trained,
      first_aid_certified: form.first_aid_certified,
      remarks: form.remarks,
    };
    saveSession(profile);
    onRegistered(profile);

    setLoading(false);
    setSubmitted(true);
  }

  function YesNoToggle({ value, onChange, error }) {
    return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: error ? 4 : 16 }}>
          {[true, false].map(v => (
            <button key={String(v)} style={S.chip(value, v)} onClick={() => onChange(v)}>
              {v ? t.yes : t.no}
            </button>
          ))}
        </div>
        {error && <p style={{ color: "#fca5a5", fontSize: 11, marginTop: -8, marginBottom: 16 }}>{error}</p>}
      </div>
    );
  }

  if (saved) {
    return (
      <div style={{ ...S.screen, textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <p style={{ color: C.gold, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Details Updated</p>
        <p style={{ color: C.gray, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Your changes have been saved.</p>
        <button style={{ ...S.btn, ...S.btnGold }} onClick={() => setScreen("register")}>Back to My Profile</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ ...S.screen, textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <p style={{ color: C.gold, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Application Submitted</p>
        <p style={{ color: C.gray, fontSize: 13, marginBottom: 8, lineHeight: 1.6 }}>Your application has been sent to the Admin for review. You'll get a notification once it's approved or rejected.</p>
        <p style={{ color: C.gray, fontSize: 12, marginBottom: 24, lineHeight: 1.6 }}>{t.appSavedDesc}</p>
        <button style={{ ...S.btn, ...S.btnGold }} onClick={() => setScreen("home")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={S.sHead}>{isEdit ? t.editTitle : t.regTitle}</div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        {isEdit ? (
          <p style={{ color: C.gray, fontSize: 12, margin: 0 }}>{t.editDesc}</p>
        ) : (
          <>
            <p style={{ color: C.gold, fontWeight: 700, fontSize: 12, margin: "0 0 4px" }}>PENDING ADMIN APPROVAL</p>
            <p style={{ color: C.gray, fontSize: 12, margin: 0 }}>{t.pendingDesc}</p>
          </>
        )}
      </div>

      <p style={S.label}>Full Name *</p>
      <input style={S.input} value={form.name} onChange={e => update("name", e.target.value)} placeholder={t.namePlaceholder} />
      {errors.name && <p style={{ color: "#fca5a5", fontSize: 11, marginTop: -8, marginBottom: 12 }}>{errors.name}</p>}

      <p style={S.label}>Roll Number (optional)</p>
      <input style={S.input} value={form.roll} onChange={e => update("roll", e.target.value)} placeholder={t.rollPlaceholder} />

      <p style={S.label}>Email ID *</p>
      <input style={S.input} type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" />
      {errors.email && <p style={{ color: "#fca5a5", fontSize: 11, marginTop: -8, marginBottom: 12 }}>{errors.email}</p>}

      <p style={S.label}>Phone Number *</p>
      <input style={S.input} type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder={t.phonePlaceholder} />
      {errors.phone && <p style={{ color: "#fca5a5", fontSize: 11, marginTop: -8, marginBottom: 12 }}>{errors.phone}</p>}

      <p style={S.label}>Department (optional)</p>
      <input style={S.input} value={form.department} onChange={e => update("department", e.target.value)} placeholder={t.deptPlaceholder} />

      <p style={S.label}>Year of Study (optional)</p>
      <input style={S.input} value={form.year} onChange={e => update("year", e.target.value)} placeholder={t.yearPlaceholder} />

      <p style={S.label}>Occupation (optional)</p>
      <input style={S.input} value={form.occupation} onChange={e => update("occupation", e.target.value)} placeholder={t.occupationPlaceholder} />

      <p style={S.label}>Have you completed First Aid Training?</p>
      <YesNoToggle value={form.first_aid_trained} onChange={v => update("first_aid_trained", v)} />

      <p style={S.label}>Do you have a First Aid Certificate? *</p>
      <YesNoToggle value={form.first_aid_certified} onChange={v => update("first_aid_certified", v)} error={errors.first_aid_certified} />

      <p style={S.label}>First Aid Training Details *</p>
      <input style={S.input} value={form.remarks} onChange={e => update("remarks", e.target.value)} placeholder={t.trainingPlaceholder} />
      {errors.remarks && <p style={{ color: "#fca5a5", fontSize: 11, marginTop: -8, marginBottom: 12 }}>{errors.remarks}</p>}

      <button style={{ ...S.btn, ...S.btnGold }} onClick={handleSubmit} disabled={loading}>
        {loading ? t.saving : isEdit ? t.saveChanges : t.submitApplication}
      </button>
      <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => setScreen(isEdit ? "register" : "home")}>Cancel</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PROFILE STATUS — replaces the registration form once someone has
// already applied. Shows "Pending Approval" or full "My Profile" with
// their saved details, instead of looping them back into Register.
// This is what fixes the bug where Register kept reappearing after
// the admin had already approved the person.
// ─────────────────────────────────────────────────────────────────────────
function ProfileStatusScreen({ status, record, setScreen, t }) {
  if (status === "pending") {
    return (
      <div style={{ ...S.screen, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
        <p style={{ color: C.gold, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t.applicationPending}</p>
        <p style={{ color: C.gray, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Your volunteer application is still under review. You'll get a notification the moment Admin approves or rejects it.
        </p>
        {record && (
          <div style={{ ...S.card, textAlign: "left" }}>
            <p style={{ color: C.gold, fontWeight: 700, fontSize: 11, margin: "0 0 8px" }}>{t.submittedDetails}</p>
            <p style={{ color: C.white, fontSize: 13, margin: "2px 0" }}>{record.name}</p>
            <p style={{ color: C.gray, fontSize: 12, margin: "2px 0" }}>📧 {record.email}</p>
            <p style={{ color: C.gray, fontSize: 12, margin: "2px 0" }}>📞 {record.phone}</p>
          </div>
        )}
        <button style={{ ...S.btn, ...S.btnGold, marginTop: 12 }} onClick={() => setScreen("editProfile")}>✏️ Edit My Details</button>
        <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => setScreen("home")}>Back to Home</button>
      </div>
    );
  }

  // approved
  return (
    <div style={S.screen}>
      <div style={S.sHead}>👤 My Profile</div>
      <div style={{ ...S.cardGold, textAlign: "center", padding: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: C.navy, margin: "0 auto 12px" }}>
          {record?.name?.charAt(0) || "?"}
        </div>
        <p style={{ color: C.white, fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>{record?.name}</p>
        <span style={S.badge(true)}>✓ Approved Volunteer</span>
      </div>
      <div style={S.card}>
        <p style={{ color: C.gold, fontWeight: 700, fontSize: 11, margin: "0 0 10px" }}>YOUR DETAILS</p>
        {record?.roll && <p style={{ color: C.gray, fontSize: 13, margin: "4px 0" }}>🎓 Roll No: {record.roll}</p>}
        <p style={{ color: C.gray, fontSize: 13, margin: "4px 0" }}>📧 {record?.email}</p>
        <p style={{ color: C.gray, fontSize: 13, margin: "4px 0" }}>📞 {record?.phone}</p>
        {record?.department && <p style={{ color: C.gray, fontSize: 13, margin: "4px 0" }}>🏛 {record.department} {record.year ? `· ${record.year}` : ""}</p>}
        {record?.occupation && <p style={{ color: C.gray, fontSize: 13, margin: "4px 0" }}>💼 {record.occupation}</p>}
        <p style={{ color: C.gray, fontSize: 13, margin: "4px 0" }}>🏅 First Aid Certified: {record?.first_aid_certified ? t.yes : t.no}</p>
        {(record?.remarks || record?.training_details) && <p style={{ color: C.gray, fontSize: 13, margin: "4px 0" }}>📋 {record.remarks || record.training_details}</p>}
      </div>
      <div style={S.card}>
        <p style={{ color: C.gold, fontWeight: 700, fontSize: 11, margin: "0 0 6px" }}>NOTE</p>
        <p style={{ color: C.gray, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
          {t.profileNote}
        </p>
      </div>
      <button style={{ ...S.btn, ...S.btnGold }} onClick={() => setScreen("editProfile")}>✏️ Edit My Details</button>
      <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => setScreen("myAlerts")}>🔔 View My Alerts</button>
      <button style={{ ...S.btn, ...S.btnNavy }} onClick={() => setScreen("home")}>Back to Home</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ALERT PANEL — shown inside Admin. Now also surfaces the caller's
// shared location for Call alerts, since location-sharing on Call Now
// is part of the spec.
// ─────────────────────────────────────────────────────────────────────────
function AlertPanel({ t }) {
  const [alerts, setAlerts] = useState([...globalAlerts]);

  useEffect(() => subscribeAlerts(a => setAlerts([...a])), []);

  function markRead(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }

  const iconFor = type => ({ call: "📞", map: "🗺", sos: "🚨", approved: "✅", rejected: "❌", broadcast: "📢", standDown: "🛑" }[type] || "🔔");
  const labelFor = type => ({ call: t.alertCall, map: t.alertMap, sos: t.alertSOS, approved: t.alertApproved, rejected: t.alertRejected, broadcast: t.alertBroadcast, standDown: t.alertStandDown }[type] || t.alertCall);

  if (alerts.length === 0) {
    return (
      <div style={{ ...S.card, textAlign: "center", padding: 28 }}>
        <p style={{ fontSize: 28, margin: "0 0 8px" }}>🔔</p>
        <p style={{ color: C.gray, fontSize: 13, margin: 0 }}>{t.noAlerts}</p>
      </div>
    );
  }

  return (
    <div>
      {alerts.map(a => {
        const urgent = a.type === "call" || a.type === "sos";
        return (
          <div key={a.id} onClick={() => markRead(a.id)} style={{ ...S.card, border: `1px solid ${urgent ? C.red : C.gold}`, background: a.read ? C.navyMid : (urgent ? "#2d0a0a" : "#1a1400"), cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{iconFor(a.type)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 12, color: urgent ? "#fca5a5" : C.gold, margin: 0 }}>{labelFor(a.type)}</p>
                  {!a.read && <span style={{ fontSize: 9, background: urgent ? C.red : C.gold, color: urgent ? C.white : C.navy, padding: "1px 6px", borderRadius: 10, fontWeight: 800 }}>NEW</span>}
                </div>
                <p style={{ color: C.white, fontSize: 12, margin: "0 0 4px", lineHeight: 1.5 }}>{a.message}</p>
                {a.userLoc && (
                  <p style={{ color: "#fbbf24", fontSize: 11, margin: "0 0 4px" }}>📍 Caller location: {a.userLoc.lat.toFixed(4)}, {a.userLoc.lng.toFixed(4)}</p>
                )}
                <p style={{ color: C.gray, fontSize: 10, margin: 0 }}>Volunteer: {a.volName} · {a.time}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// VOLUNTEER ALERTS — "My Alerts" tab. Shows the alerts addressed to the
// currently logged-in volunteer (matched by email), with the user's
// exact location and a Navigate button so the volunteer can actually
// reach the person who called or hit SOS — not just see a notification.
// ─────────────────────────────────────────────────────────────────────────
function VolunteerAlertsScreen({ session, volunteerRecord, volunteers = [], t }) {
  const [alerts, setAlerts] = useState([...globalAlerts]);
  const [responses, setResponses] = useState([...activeResponses]);

  useEffect(() => subscribeAlerts(a => setAlerts([...a])), []);
  useEffect(() => subscribeResponses(r => setResponses([...r])), []);

  if (!session || !session.email) {
    return (
      <div style={S.screen}>
        <div style={S.sHead}>🔔 My Alerts</div>
        <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>🔒</p>
          <p style={{ color: C.gray, fontSize: 13, margin: 0 }}>Log in and register as a volunteer to receive alerts here.</p>
        </div>
      </div>
    );
  }

  const myAlerts = alerts.filter(a => a.volEmail === session.email);
  const unreadCount = myAlerts.filter(a => !a.read).length;
  const myActiveResponse = volunteerRecord ? responses.find(r => r.volId === volunteerRecord.id) : null;

  function markRead(id) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }

  function respond(alertId) {
    if (!volunteerRecord) return;
    const alert = myAlerts.find(a => a.id === alertId);
    markResponding(alertId, volunteerRecord, alert?.userLoc || null, volunteers);
  }

  function cancelResponse() {
    if (!volunteerRecord) return;
    stopResponding(volunteerRecord.id);
  }

  const iconFor = type => ({ call: "📞", map: "🗺", sos: "🚨", approved: "✅", rejected: "❌", broadcast: "📢", standDown: "🛑" }[type] || "🔔");
  const labelFor = type => ({ call: t.alertCall, map: t.alertMap, sos: t.alertSOS, approved: t.alertApproved, rejected: t.alertRejected, broadcast: t.alertBroadcast, standDown: t.alertStandDown }[type] || t.alertCall);

  return (
    <div style={S.screen}>
      <div style={S.sHead}>🔔 My Alerts {unreadCount > 0 ? `(${unreadCount} new)` : ""}</div>
      <p style={{ color: C.gray, fontSize: 11, marginTop: -8, marginBottom: 16 }}>
        Alerts sent to you as {session.name || session.email}
      </p>

      {myActiveResponse && (
        <div style={{ ...S.cardGold, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏃</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: C.gold, fontWeight: 700, fontSize: 12, margin: 0 }}>{t.respondingNow}</p>
            <p style={{ color: C.gray, fontSize: 11, margin: "2px 0 0" }}>{t.respondingDesc} {myActiveResponse?.startedAt}</p>
          </div>
          <button style={{ ...S.btnSm, background: C.navyLight, color: C.white }} onClick={cancelResponse}>Stop</button>
        </div>
      )}

      {myAlerts.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 28 }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>🔔</p>
          <p style={{ color: C.gray, fontSize: 13, margin: 0 }}>No alerts yet. You'll be notified here the instant someone calls you or triggers an SOS nearby.</p>
        </div>
      )}

      {myAlerts.map(a => {
        const urgent = a.type === "call" || a.type === "sos";
        const navUrl = a.userLoc
          ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=&destination=${a.userLoc.lat}%2C${a.userLoc.lng}`
          : null;
        const isRespondingToThis = myActiveResponse && myActiveResponse.alertId === a.id;
        return (
          <div key={a.id} onClick={() => markRead(a.id)} style={{ ...S.card, border: `1px solid ${urgent ? C.red : C.gold}`, background: a.read ? C.navyMid : (urgent ? "#2d0a0a" : "#1a1400"), cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: a.userLoc ? 10 : 0 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{iconFor(a.type)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 12, color: urgent ? "#fca5a5" : C.gold, margin: 0 }}>{labelFor(a.type)}</p>
                  {!a.read && <span style={{ fontSize: 9, background: urgent ? C.red : C.gold, color: urgent ? C.white : C.navy, padding: "1px 6px", borderRadius: 10, fontWeight: 800 }}>NEW</span>}
                </div>
                <p style={{ color: C.white, fontSize: 12, margin: "0 0 4px", lineHeight: 1.5 }}>{a.message}</p>
                {/* Show user's phone number so volunteer can call them back directly */}
                {a.userPhone && (urgent) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0" }}>
                    <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700, margin: 0 }}>📞 User's phone: {a.userPhone}</p>
                    <button
                      style={{ ...S.btnSm, background: C.red, color: C.white, padding: "4px 10px", fontSize: 11 }}
                      onClick={(e) => { e.stopPropagation(); window.open(`tel:${a.userPhone}`, "_self"); }}
                    >Call</button>
                  </div>
                )}
                {/* Show responder's phone in stand-down alerts */}
                {a.type === "standDown" && a.respondingVolPhone && (
                  <p style={{ color: "#86efac", fontSize: 11, margin: "4px 0 0" }}>
                    Responder: {a.respondingVolName} · 📞 {a.respondingVolPhone}
                  </p>
                )}
                <p style={{ color: C.gray, fontSize: 10, margin: "4px 0 0" }}>{a.time}</p>
              </div>
            </div>
            {a.userLoc && (
              <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "8px 10px" }}>
                <p style={{ color: "#fbbf24", fontSize: 11, margin: "0 0 8px" }}>📍 Person's exact location: {a.userLoc.lat.toFixed(5)}, {a.userLoc.lng.toFixed(5)}</p>
                <button
                  style={{ ...S.btn, ...S.btnGold, marginBottom: 0, padding: "8px 12px", fontSize: 12 }}
                  onClick={(e) => { e.stopPropagation(); window.open(navUrl, "_blank"); }}
                >
                  🧭 Navigate to This Person
                </button>
                {a.type === "sos" && !isRespondingToThis && (
                  <button
                    style={{ ...S.btn, ...S.btnRed, marginBottom: 0, marginTop: 8, padding: "8px 12px", fontSize: 12 }}
                    onClick={(e) => { e.stopPropagation(); respond(a.id); }}
                  >
                    {t.imResponding}
                  </button>
                )}
                {isRespondingToThis && (
                  <p style={{ color: "#86efac", fontSize: 11, marginTop: 8, marginBottom: 0, fontWeight: 700 }}>{t.sharingLocation}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────
function AdminScreen({ volunteers, setVolunteers, sosCountToday, casesHandled, setCasesHandled, t }) {
  const [tab, setTab] = useState("alerts");
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  useEffect(() => subscribeAlerts(alerts => setAlertCount(alerts.filter(a => !a.read).length)), []);

  if (!unlocked) {
    return (
      <div style={S.screen}>
        <div style={S.sHead}>🔐 Admin Access</div>
        <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
          <p style={{ color: C.gray, fontSize: 13, marginBottom: 16 }}>{t.adminPinDesc}</p>
          <input style={{ ...S.input, textAlign: "center", fontSize: 16, letterSpacing: 2 }} type="password" placeholder={t.adminPinPlaceholder} maxLength={20} value={pin} onChange={e => setPin(e.target.value)} />
          <button style={{ ...S.btn, ...S.btnGold }} onClick={() => { if (pin === ADMIN_PIN) setUnlocked(true); else alert(t.invalidPin); }}>
            Unlock Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pending = volunteers.filter(v => !v.approved);
  const approved = volunteers.filter(v => v.approved);

  // Approving fires an instant notification to that volunteer.
  function approve(v) {
    setVolunteers(prev => prev.map(x => x.id === v.id ? { ...x, approved: true, online: true, availability: true } : x));
    sendVolunteerAlert(v, "approved");
    playEmergencySound("map");
  }

  function reject(v) {
    if (!window.confirm(t.confirmReject)) return;
    setVolunteers(prev => prev.filter(x => x.id !== v.id));
    sendVolunteerAlert(v, "rejected");
  }

  // Admin can remove ANY volunteer, approved or not — full control.
  function removeVolunteer(v) {
    if (!window.confirm(t.confirmRemove)) return;
    setVolunteers(prev => prev.filter(x => x.id !== v.id));
  }

  function sendBroadcast() {
    if (!broadcastMsg.trim()) return;
    approved.forEach(v => sendVolunteerAlert(v, "broadcast", { message: broadcastMsg }));
    playEmergencySound("sos");
    setBroadcastMsg("");
    alert(`${t.broadcastSent} ${approved.length} ${t.broadcastSentTo}`);
  }

  const tabs = [
    { k: "alerts", label: `${t.tabAlerts}${alertCount > 0 ? ` (${alertCount})` : ""}` },
    { k: "pending", label: `${t.tabPending} (${pending.length})` },
    { k: "approved", label: `${t.tabApproved} (${approved.length})` },
    { k: "contacts", label: `📞 Contacts` },
    { k: "guide", label: `🩺 Guide` },
    { k: "broadcast", label: `📢 Broadcast` },
  ];

  return (
    <div style={S.screen}>
      <div style={S.sHead}>🛡 Admin Dashboard</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
        {tabs.map(({ k, label }) => (
          <button key={k} style={{ ...S.btn, ...(tab === k ? S.btnGold : S.btnNavy), marginBottom: 0, padding: "9px 6px", fontSize: 11 }} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "alerts" && <AlertPanel t={t} />}
      {tab === "contacts" && <ContactsScreen canEdit embedded t={t} />}
      {tab === "guide" && <FirstAidGuideScreen setScreen={() => {}} canEdit t={t} />}

      {tab === "broadcast" && (
        <div>
          <div style={S.card}>
            <p style={S.label}>Emergency Broadcast Message</p>
            <textarea
              style={{ ...S.input, minHeight: 90, resize: "vertical", fontFamily: "inherit" }}
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              placeholder={t.broadcastPlaceholder}
            />
            <button style={{ ...S.btn, ...S.btnGold, marginBottom: 0 }} onClick={sendBroadcast}>📢 Send to All Approved Volunteers</button>
          </div>
        </div>
      )}

      {(tab === "pending" || tab === "approved") && (
        <>
          {(tab === "pending" ? pending : approved).length === 0 && (
            <div style={{ ...S.card, textAlign: "center", padding: 32 }}>
              <p style={{ color: C.gray, fontSize: 13 }}>No {tab} volunteers.</p>
            </div>
          )}
          {(tab === "pending" ? pending : approved).map(vol => (
            <div key={vol.id} style={S.card}>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: vol.approved ? C.gold : C.gray, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: C.navy, flexShrink: 0 }}>
                  {vol.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: 0 }}>{vol.name}</p>
                  <p style={{ fontSize: 11, color: C.gray, margin: "2px 0 0" }}>{vol.department || vol.occupation || "—"} {vol.year ? `· ${vol.year}` : ""}</p>
                </div>
                {vol.approved && (
                  <span style={S.badge(vol.online)}>{vol.online ? t.online : t.offline}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 10, lineHeight: 1.6 }}>
                {vol.roll && <p style={{ margin: "2px 0" }}>🎓 {vol.roll}</p>}
                <p style={{ margin: "2px 0" }}>📧 {vol.email}</p>
                <p style={{ margin: "2px 0" }}>📞 {vol.phone}</p>
                {vol.occupation && <p style={{ margin: "2px 0" }}>💼 {vol.occupation}</p>}
                <p style={{ margin: "2px 0" }}>🏅 First Aid Certified: {vol.first_aid_certified ? t.yes : t.no}</p>
                {(vol.remarks || vol.training_details) && <p style={{ margin: "2px 0" }}>📋 {vol.remarks || vol.training_details}</p>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!vol.approved && (
                  <button style={{ ...S.btnSm, background: C.green, color: C.white, flex: 1 }} onClick={() => approve(vol)}>
                    ✓ Approve
                  </button>
                )}
                <button
                  style={{ ...S.btnSm, background: C.red, color: C.white, flex: 1 }}
                  onClick={() => vol.approved ? removeVolunteer(vol) : reject(vol)}
                >
                  {vol.approved ? t.remove : t.reject}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────
// PHONE NUMBER GATE — shown once after location is enabled. Saves the
// user's phone number permanently so volunteers can call them back
// directly if the map or app has any issue. Never asked again after
// the first time — the number is always there in the app.
// ─────────────────────────────────────────────────────────────────────────
function PhoneNumberGate({ onSaved, t }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }
    saveUserPhone(trimmed);
    onSaved();
  }

  return (
    <div style={{ padding: "20px 16px", paddingBottom: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📞</div>
        <p style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{t.phoneGateTitle}</p>
        <p style={{ color: C.gray, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          Enter your phone number so that if you press SOS or call a volunteer, they can call you back directly — even if the map or app has any issue.
        </p>
      </div>
      <div style={{ ...S.card }}>
        <p style={{ color: C.gold, fontWeight: 700, fontSize: 11, margin: "0 0 4px" }}>YOUR PHONE NUMBER</p>
        <p style={{ color: C.gray, fontSize: 11, margin: "0 0 12px" }}>Saved permanently — never asked again.</p>
        <input
          style={{ ...S.input, fontSize: 18, letterSpacing: 1 }}
          type="tel"
          placeholder={t.phonePlaceholder}
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(""); }}
        />
        {error && <p style={{ color: "#fca5a5", fontSize: 12, marginTop: -8, marginBottom: 12 }}>{error}</p>}
        <button style={{ ...S.btn, ...S.btnGold, marginBottom: 0 }} onClick={handleSave}>
          Save & Continue
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────
export default function EmergencyApp() {
  // PSG College of Arts & Science crest (left) and Alert Golden Army
  // logo (right), embedded as base64 so they render with zero external
  // dependency or broken file paths. Already wired through to the
  // Header on both the gate and main app screens.
  const LEFT_LOGO_URL = "data:image/png;base64,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";
  const RIGHT_LOGO_URL = "data:image/png;base64,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";

  const { lang, t, toggle: toggleLang } = useLang();

  const [screen, setScreen] = useState("home");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [phoneCollected, setPhoneCollected] = useState(() => hasUserPhone());
  const [locationDenied, setLocationDenied] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [userLoc, setUserLoc] = useState(null);
  const [selectedVol, setSelectedVol] = useState(null);
  const [toast, setToast] = useState(null);
  const [alertBadge, setAlertBadge] = useState(0);
  const [session, setSession] = useState(() => getSession());
  const [volunteerPopupAlert, setVolunteerPopupAlert] = useState(null);
  const [volunteers, setVolunteers] = useState([...MOCK_VOLUNTEERS, ...MOCK_PENDING]);
  const [sosCountToday, setSosCountToday] = useState(0);
  const [casesHandled, setCasesHandled] = useState(12); // seed historical stat

  useEffect(() => {
    return subscribeAlerts(alerts => {
      const unread = alerts.filter(a => !a.read).length;
      setAlertBadge(unread);
      const latest = alerts[0];
      if (latest) {
        setToast(latest);
        setTimeout(() => setToast(null), 4500);

        // If this alert is addressed to the volunteer currently logged
        // in on this device, also fire a full-screen, can't-miss popup
        // (in addition to the My Alerts inbox tab).
        const isUrgent = latest.type === "call" || latest.type === "sos";
        if (isUrgent && session && session.email && latest.volEmail === session.email) {
          setVolunteerPopupAlert(latest);
        }
      }
    });
  }, [session]);

  function enableLocation() {
    setCheckingLocation(true);
    // DEMO MODE: resolves immediately using campus coordinates so the
    // gate doesn't hang waiting on real device GPS inside this preview.
    // Swap to navigator.geolocation.getCurrentPosition(...) for production.
    setTimeout(() => {
      setUserLoc({ lat: CAMPUS_CENTER.lat, lng: CAMPUS_CENTER.lng });
      setLocationEnabled(true);
      setLocationDenied(false);
      setCheckingLocation(false);
    }, 400);
  }

  // SOS — captures location, finds nearest available volunteers, alerts
  // all of them at once with the user's exact location attached.
  function triggerSOS() {
    const nearby = volunteers
      .filter(v => v.approved && v.online && v.availability)
      .map(v => ({ ...v, distance: userLoc && v.lat ? haversineMeters(userLoc.lat, userLoc.lng, v.lat, v.lng) : v.distance }))
      .filter(v => v.distance <= CAMPUS_RADIUS_KM * 1000)
      .sort((a, b) => a.distance - b.distance);

    if (nearby.length === 0) {
      alert(t.sosNoVolunteers);
      setScreen("contacts");
      return;
    }

    nearby.forEach(v => sendVolunteerAlert(v, "sos", { userLoc, userPhone: getUserPhone() }));
    playEmergencySound("sos");
    setSosCountToday(c => c + 1);
    alert(`${t.sosSent} ${nearby.length} ${t.sosSentTo}`);
  }

  function handleLoggedIn(profile) {
    setSession(profile);
    if (profile.registered) {
      setScreen("home"); // already registered — just restored
    } else {
      setScreen("register");
    }
  }

  function handleRegistered(profile) {
    setSession(profile);
    // Add this person into the volunteers pool as a pending application.
    setVolunteers(prev => [
      ...prev,
      {
        id: Date.now(),
        name: profile.name,
        roll: profile.roll,
        department: profile.department,
        year: profile.year,
        occupation: profile.occupation,
        email: profile.email,
        phone: profile.phone,
        first_aid_trained: profile.first_aid_trained,
        first_aid_certified: profile.first_aid_certified,
        remarks: profile.remarks,
        availability: true,
        online: false,
        approved: false,
        lat: userLoc?.lat || CAMPUS_CENTER.lat,
        lng: userLoc?.lng || CAMPUS_CENTER.lng,
        distance: 0,
      },
    ]);
  }

  // Volunteer editing their own already-submitted details — preserves
  // approval status, ID, and location; only the editable fields change.
  function handleProfileUpdate(updatedRecord) {
    setVolunteers(prev => prev.map(v => v.id === updatedRecord.id ? { ...v, ...updatedRecord } : v));
  }

  if (checkingLocation) {
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.gold }}>Loading…</p>
      </div>
    );
  }

  if (!locationEnabled) {
    return <LocationGate onEnable={enableLocation} denied={locationDenied} t={t} lang={lang} onToggleLang={toggleLang} leftLogo={LEFT_LOGO_URL} rightLogo={RIGHT_LOGO_URL} />;
  }

  // Phone number gate — shown once after location is enabled.
  // Saved permanently so it's never asked again. Goes to volunteers
  // in every SOS/Call alert so they can call the user back if needed.
  if (!phoneCollected) {
    return (
      <div style={S.app}>
        <Header t={t} lang={lang} onToggleLang={toggleLang} leftLogo={LEFT_LOGO_URL} rightLogo={RIGHT_LOGO_URL} />
        <PhoneNumberGate onSaved={() => setPhoneCollected(true)} t={t} />
      </div>
    );
  }
  // Look up the live status of the logged-in person directly from the
  // volunteers list (the same array Admin edits) — never trust a stale
  // copy in session, since that field doesn't auto-update when Admin
  // approves someone. This is what was causing "Register" to keep
  // showing even after approval.
  const myVolunteerRecord = session ? volunteers.find(v => v.email === session.email) : null;
  const myStatus = !session
    ? "loggedOut"
    : !myVolunteerRecord
    ? "notRegistered"
    : myVolunteerRecord.approved
    ? "approved"
    : "pending";

  const myUnreadCount = myStatus === "approved" || myStatus === "pending"
    ? globalAlerts.filter(a => a.volEmail === session.email && !a.read).length
    : 0;

  const profileTabLabel = {
    loggedOut: t.registerVolunteer,
    notRegistered: t.registerVolunteer,
    pending: "⏳ Pending",
    approved: t.myProfile,
  }[myStatus];

  const navItems = [
    { id: "home", icon: "🏠", label: t.home },
    { id: "volunteers", icon: "🆘", label: t.volunteers },
    ...(myStatus === "approved" ? [{ id: "myAlerts", icon: "🔔", label: t.myAlerts, badge: myUnreadCount }] : []),
    { id: "register", icon: myStatus === "approved" ? "👤" : "📝", label: profileTabLabel },
    { id: "admin", icon: "🛡", label: t.admin },
  ];

  const screens = {
    home: <HomeScreen userLoc={userLoc} setScreen={setScreen} t={t} onSOS={triggerSOS} volunteers={volunteers} sosCountToday={sosCountToday} casesHandled={casesHandled} />,
    volunteers: <VolunteersScreen userLoc={userLoc} setScreen={setScreen} setSelectedVol={setSelectedVol} volunteers={volunteers} t={t} />,
    map: <MapScreen userLoc={userLoc} selectedVol={selectedVol} setScreen={setScreen} t={t} />,
    campusMap: <CampusMapScreen setScreen={setScreen} t={t} />,
    contacts: <ContactsScreen canEdit={false} t={t} />,
    firstAid: <FirstAidGuideScreen setScreen={setScreen} canEdit={false} t={t} />,
    login: <LoginScreen onLoggedIn={handleLoggedIn} setScreen={setScreen} t={t} />,
    register: !session
      ? <LoginScreen onLoggedIn={handleLoggedIn} setScreen={setScreen} t={t} />
      : myStatus === "notRegistered"
      ? <RegisterScreen setScreen={setScreen} session={session} onRegistered={handleRegistered} t={t} />
      : <ProfileStatusScreen status={myStatus} record={myVolunteerRecord} setScreen={setScreen} t={t} />,
    editProfile: <RegisterScreen setScreen={setScreen} session={session} existingRecord={myVolunteerRecord} onUpdate={handleProfileUpdate} t={t} />,
    myAlerts: <VolunteerAlertsScreen session={session} volunteerRecord={myVolunteerRecord} volunteers={volunteers} t={t} />,
    admin: <AdminScreen volunteers={volunteers} setVolunteers={setVolunteers} sosCountToday={sosCountToday} casesHandled={casesHandled} setCasesHandled={setCasesHandled} t={t} />,
  };

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        *{-webkit-tap-highlight-color:transparent;}
        input::placeholder,textarea::placeholder{color:#475569;}
        input:focus,textarea:focus{border-color:#D4A017!important;box-shadow:0 0 0 2px rgba(212,160,23,0.2);}
        button:active{transform:scale(0.97);}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0A1628}::-webkit-scrollbar-thumb{background:#1A3058;border-radius:4px}
      `}</style>

      {/* Full-screen, can't-miss popup — fires the instant a Call/SOS
          alert arrives for the volunteer logged in on this device.
          Distinct from the small toast: this is unmissable and includes
          a direct Navigate-to-User action right there. */}
      {volunteerPopupAlert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(127,29,29,0.92)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "slideDown 0.25s ease" }}>
          <div style={{ background: C.navy, border: `2px solid ${C.red}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 360, textAlign: "center", boxShadow: "0 0 40px rgba(192,57,43,0.7)" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{volunteerPopupAlert.type === "sos" ? "🆘" : "🚨"}</div>
            <p style={{ color: C.white, fontWeight: 800, fontSize: 18, margin: "0 0 6px" }}>
              {volunteerPopupAlert.type === "sos" ? "SOS — Emergency Help Needed" : "Someone is Calling You"}
            </p>
            <p style={{ color: "#fca5a5", fontSize: 13, margin: "0 0 18px", lineHeight: 1.5 }}>{volunteerPopupAlert.message}</p>
            {volunteerPopupAlert.userLoc && (
              <p style={{ color: "#fbbf24", fontSize: 12, margin: "0 0 18px" }}>
                📍 Exact location: {volunteerPopupAlert.userLoc.lat.toFixed(5)}, {volunteerPopupAlert.userLoc.lng.toFixed(5)}
              </p>
            )}
            {volunteerPopupAlert.userLoc && (
              <button
                style={{ ...S.btn, ...S.btnGold }}
                onClick={() => {
                  const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=&destination=${volunteerPopupAlert.userLoc.lat}%2C${volunteerPopupAlert.userLoc.lng}`;
                  window.open(url, "_blank");
                }}
              >
                🧭 Navigate to This Person
              </button>
            )}
            {volunteerPopupAlert.type === "sos" && volunteerPopupAlert.userLoc && myVolunteerRecord && (
              <button
                style={{ ...S.btn, ...S.btnRed }}
                onClick={() => {
                  markResponding(volunteerPopupAlert.id, myVolunteerRecord, volunteerPopupAlert.userLoc, volunteers);
                  setVolunteerPopupAlert(null);
                }}
              >
                🏃 I'm Responding — Share My Live Location
              </button>
            )}
            <button style={{ ...S.btn, ...S.btnNavy, marginBottom: 0 }} onClick={() => setVolunteerPopupAlert(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", top: 96, left: "50%", transform: "translateX(-50%)", zIndex: 999, width: "90%", maxWidth: 380, background: (toast.type === "call" || toast.type === "sos") ? "#7f1d1d" : "#1a1400", border: `2px solid ${(toast.type === "call" || toast.type === "sos") ? C.red : C.gold}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, animation: "slideDown 0.3s ease" }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{toast.type === "call" ? "🚨" : toast.type === "sos" ? "🆘" : toast.type === "approved" ? "✅" : toast.type === "rejected" ? "❌" : toast.type === "broadcast" ? "📢" : "👁"}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 11, color: (toast.type === "call" || toast.type === "sos") ? "#fca5a5" : C.gold, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Alert dispatched
            </p>
            <p style={{ color: C.white, fontSize: 12, margin: 0 }}>To <strong>{toast.volName}</strong>: {toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: C.gray, fontSize: 18, cursor: "pointer", padding: 0 }}>✕</button>
        </div>
      )}

      <Header t={t} lang={lang} onToggleLang={toggleLang} leftLogo={LEFT_LOGO_URL} rightLogo={RIGHT_LOGO_URL} />
      <div>{screens[screen] || screens.home}</div>

      <nav style={S.navBar}>
        {navItems.map(n => (
          <button key={n.id} style={S.navBtn(screen === n.id || (screen === "map" && n.id === "volunteers"))} onClick={() => setScreen(n.id)}>
            <span style={{ fontSize: 20, position: "relative", display: "inline-block" }}>
              {n.icon}
              {n.id === "admin" && alertBadge > 0 && (
                <span style={{ position: "absolute", top: -4, right: -6, background: C.red, color: C.white, borderRadius: "50%", fontSize: 8, fontWeight: 800, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{alertBadge}</span>
              )}
              {n.id === "myAlerts" && n.badge > 0 && (
                <span style={{ position: "absolute", top: -4, right: -6, background: C.red, color: C.white, borderRadius: "50%", fontSize: 8, fontWeight: 800, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{n.badge}</span>
              )}
            </span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
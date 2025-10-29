/**
 * User-Friendly Error Messages and Recovery Suggestions
 * Provides comprehensive, context-aware error messages for common cloud save issues
 */

import { CloudError, CloudErrorCode, ErrorSeverity } from './cloudErrors';

export interface UserFriendlyErrorData {
  title: string;
  message: string;
  explanation: string;
  immediate_actions: string[];
  detailed_steps: string[];
  prevention_tips: string[];
  when_to_contact_support: string;
  estimated_resolution_time: string;
  severity_impact: string;
}

/**
 * Comprehensive error message database for common cloud save issues
 */
const ERROR_MESSAGE_DATABASE: Record<CloudErrorCode, UserFriendlyErrorData> = {
  [CloudErrorCode.NETWORK_UNAVAILABLE]: {
    title: 'No Internet Connection',
    message:
      "Your device isn't connected to the internet, so cloud features aren't available right now.",
    explanation:
      'Cloud save features require an active internet connection to sync your game progress. Without internet, you can continue playing, but your progress will only be saved locally.',
    immediate_actions: [
      'Check your WiFi or mobile data connection',
      'Try refreshing the page',
      'Continue playing - your progress will be saved locally',
    ],
    detailed_steps: [
      "1. Check your device's internet connection settings",
      '2. Try connecting to a different WiFi network if available',
      '3. Disable and re-enable your WiFi connection',
      "4. Restart your router if you're on WiFi",
      '5. Check if other websites or apps are working',
      '6. Wait for your connection to be restored',
    ],
    prevention_tips: [
      'Ensure stable internet before starting long gaming sessions',
      'Use auto-save to minimize data loss during connection issues',
      'Consider downloading the game for offline play if available',
    ],
    when_to_contact_support:
      'If your internet works for other apps but cloud save consistently fails',
    estimated_resolution_time: 'Usually resolves when internet connection is restored',
    severity_impact: 'Low - You can continue playing with local saves',
  },

  [CloudErrorCode.NETWORK_ERROR]: {
    title: 'Connection Problem',
    message: "There's a temporary issue connecting to our cloud save servers.",
    explanation:
      'This usually happens due to temporary network problems, server maintenance, or high traffic. Your local progress is safe.',
    immediate_actions: [
      'Wait a few minutes and try again',
      'Check your internet connection',
      'Continue playing with local saves',
    ],
    detailed_steps: [
      '1. Wait 2-3 minutes for the connection to stabilize',
      '2. Refresh the page or restart the game',
      '3. Check if our servers are undergoing maintenance',
      '4. Try accessing the game from a different device',
      '5. Clear your browser cache if the problem persists',
      '6. Try using a different internet connection',
    ],
    prevention_tips: [
      'Save your game regularly using local saves as backup',
      'Check our status page for planned maintenance',
      'Use a stable internet connection for gaming',
    ],
    when_to_contact_support: 'If the problem persists for more than 30 minutes',
    estimated_resolution_time: '2-5 minutes for temporary issues, longer for server maintenance',
    severity_impact: 'Medium - Cloud features temporarily unavailable',
  },

  [CloudErrorCode.NETWORK_TIMEOUT]: {
    title: 'Connection Timeout',
    message: 'The cloud save operation took too long and was cancelled to prevent data loss.',
    explanation:
      'This happens when your internet connection is very slow or unstable. The operation was safely cancelled to protect your save data.',
    immediate_actions: [
      'Check your internet speed',
      'Try the operation again',
      'Use a more stable connection if possible',
    ],
    detailed_steps: [
      '1. Test your internet speed using a speed test website',
      '2. Close other applications using internet bandwidth',
      '3. Move closer to your WiFi router if using wireless',
      '4. Try the save operation again',
      '5. Consider saving to local storage first, then syncing later',
      '6. Switch to a faster internet connection if available',
    ],
    prevention_tips: [
      'Ensure good internet speed before cloud operations',
      'Close bandwidth-heavy applications during save operations',
      'Use wired connection instead of WiFi for better stability',
    ],
    when_to_contact_support: 'If timeouts happen consistently with good internet',
    estimated_resolution_time: 'Immediate with better internet connection',
    severity_impact: 'Low - Operation can be retried',
  },

  [CloudErrorCode.AUTH_REQUIRED]: {
    title: 'Sign In Required',
    message: 'You need to sign in to your account to use cloud save features.',
    explanation:
      'Cloud saves are linked to your account for security and privacy. Signing in ensures your saves are protected and accessible only by you.',
    immediate_actions: [
      'Click the Sign In button',
      'Enter your email and password',
      "Create an account if you don't have one",
    ],
    detailed_steps: [
      "1. Click the 'Sign In' or 'Account' button in the main menu",
      '2. Enter the email and password for your account',
      "3. If you forgot your password, use the 'Reset Password' link",
      "4. If you don't have an account, click 'Create Account' instead",
      '5. Follow the email verification process if required',
      '6. Once signed in, cloud features will be available',
    ],
    prevention_tips: [
      'Stay signed in to avoid repeated login prompts',
      'Use a password manager to remember your credentials',
      'Enable two-factor authentication for better security',
    ],
    when_to_contact_support: "If you can't access your account or forgot your email",
    estimated_resolution_time: 'Immediate after signing in',
    severity_impact: 'Low - Local saves still work, cloud features disabled',
  },

  [CloudErrorCode.AUTH_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your login session has expired for security reasons. Please sign in again.',
    explanation:
      'For your security, login sessions automatically expire after a period of time. This helps protect your account from unauthorized access.',
    immediate_actions: [
      'Sign in again with your credentials',
      "Enable 'Remember Me' if available",
      'Continue with local saves if needed',
    ],
    detailed_steps: [
      "1. Click 'Sign In' when prompted",
      '2. Re-enter your email and password',
      "3. Check 'Remember Me' to stay signed in longer",
      '4. If you keep getting logged out, check your browser settings',
      '5. Clear browser cookies and try signing in again',
      "6. Make sure your device's time and date are correct",
    ],
    prevention_tips: [
      "Enable 'Remember Me' option when signing in",
      'Keep your browser updated',
      "Don't use incognito/private browsing for gaming sessions",
    ],
    when_to_contact_support: 'If session expires very frequently (every few minutes)',
    estimated_resolution_time: 'Immediate after re-signing in',
    severity_impact: 'Low - Quick fix by signing in again',
  },

  [CloudErrorCode.AUTH_INVALID]: {
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect.',
    explanation:
      "The login credentials don't match any account in our system. This could be due to typos, forgotten passwords, or using the wrong email address.",
    immediate_actions: [
      'Double-check your email and password',
      "Use 'Forgot Password' if needed",
      'Make sure Caps Lock is off',
    ],
    detailed_steps: [
      '1. Carefully re-type your email address',
      '2. Re-type your password, checking for typos',
      '3. Make sure Caps Lock is turned off',
      "4. If still failing, click 'Forgot Password'",
      '5. Check your email for the password reset link',
      '6. Create a new password following the requirements',
      '7. Try signing in with the new password',
    ],
    prevention_tips: [
      'Use a password manager to avoid typos',
      'Write down your login email when creating the account',
      'Use a memorable but secure password',
    ],
    when_to_contact_support:
      "If you're certain your credentials are correct but still can't sign in",
    estimated_resolution_time: 'Immediate with correct credentials, or after password reset',
    severity_impact: "Medium - Can't access cloud features until resolved",
  },

  [CloudErrorCode.STORAGE_QUOTA_EXCEEDED]: {
    title: 'Cloud Storage Full',
    message: 'Your cloud storage space is full. You need to free up space before saving new data.',
    explanation:
      "Each account has a limited amount of cloud storage space. When it's full, you can't save new data until you delete some old saves or upgrade your storage.",
    immediate_actions: [
      'Delete old or unused save files',
      'Save to local storage for now',
      'Review your save file sizes',
    ],
    detailed_steps: [
      '1. Go to the Save Management section',
      '2. Review your existing cloud saves',
      '3. Delete saves you no longer need',
      '4. Download important saves locally before deleting',
      '5. Try your save operation again',
      '6. Consider upgrading storage if you need more space',
    ],
    prevention_tips: [
      'Regularly clean up old save files',
      'Keep only your most important saves in the cloud',
      'Use local saves for experimental gameplay',
      'Monitor your storage usage regularly',
    ],
    when_to_contact_support: 'If storage quota seems incorrect or if you need more space',
    estimated_resolution_time: 'Immediate after freeing up space',
    severity_impact: 'High - Cannot save to cloud until space is freed',
  },

  [CloudErrorCode.STORAGE_PERMISSION_DENIED]: {
    title: 'Access Denied',
    message: "You don't have permission to access this cloud storage area.",
    explanation:
      "This error occurs when there's a problem with your account permissions or if you're trying to access data that doesn't belong to your account.",
    immediate_actions: [
      "Make sure you're signed into the correct account",
      'Try signing out and back in',
      'Check if your account is in good standing',
    ],
    detailed_steps: [
      "1. Verify you're signed into the correct account",
      '2. Sign out completely and sign back in',
      '3. Clear your browser cache and cookies',
      '4. Try accessing from a different device',
      '5. Check if your account has any restrictions',
      '6. Verify your account email is confirmed',
    ],
    prevention_tips: [
      'Keep your account in good standing',
      "Don't share account credentials",
      'Verify your email address when creating accounts',
    ],
    when_to_contact_support: 'If the problem persists after trying all steps',
    estimated_resolution_time: 'Usually immediate after re-authentication',
    severity_impact: 'High - Cannot access cloud features',
  },

  [CloudErrorCode.STORAGE_NOT_FOUND]: {
    title: 'Save File Not Found',
    message: "The save file you're trying to access no longer exists in cloud storage.",
    explanation:
      'This save file may have been deleted, corrupted, or moved. It could also be a temporary server issue preventing access to your data.',
    immediate_actions: [
      'Check if you have a local backup',
      'Try refreshing the save list',
      'Look for the save in a different slot',
    ],
    detailed_steps: [
      '1. Refresh the cloud save list to see current files',
      '2. Check if you have a local backup of this save',
      '3. Look in your recently deleted files if available',
      '4. Try accessing from a different device',
      '5. Check if the save exists in a different save slot',
      '6. Restore from an earlier backup if available',
    ],
    prevention_tips: [
      'Keep local backups of important saves',
      "Don't delete saves unless you're certain",
      'Use multiple save slots for important progress',
    ],
    when_to_contact_support: 'If important save files have disappeared without your action',
    estimated_resolution_time: 'Depends on backup availability',
    severity_impact: 'High - Lost save data unless backup available',
  },

  [CloudErrorCode.STORAGE_CORRUPTED]: {
    title: 'Save File Corrupted',
    message: 'The save file appears to be corrupted and cannot be loaded safely.',
    explanation:
      'Save file corruption can happen due to interrupted uploads, storage device issues, or data transmission errors. The file cannot be safely loaded to prevent further issues.',
    immediate_actions: [
      'Try loading a different save file',
      'Look for an automatic backup',
      "Don't try to force-load the corrupted file",
    ],
    detailed_steps: [
      '1. Do not attempt to load the corrupted save file',
      "2. Check if there's an automatic backup available",
      '3. Try loading an earlier save from the same slot',
      '4. Look for other save files with recent progress',
      '5. Check your local saves for a backup copy',
      '6. Start a new game if no backups are available',
    ],
    prevention_tips: [
      'Use multiple save slots regularly',
      "Don't interrupt save operations",
      'Ensure stable internet during cloud saves',
      'Keep local backups of important progress',
    ],
    when_to_contact_support: 'If corruption happens frequently or affects multiple saves',
    estimated_resolution_time: 'Depends on backup availability',
    severity_impact: 'Critical - Save data may be lost',
  },

  [CloudErrorCode.DATA_TOO_LARGE]: {
    title: 'Save File Too Large',
    message: 'Your save file is too large to upload to cloud storage.',
    explanation:
      'Save files have size limits to ensure good performance and reasonable storage usage. Your save file has exceeded this limit, possibly due to large inventory or extensive progress.',
    immediate_actions: [
      'Clear unnecessary items from inventory',
      'Save to local storage instead',
      'Try compressing the save data',
    ],
    detailed_steps: [
      '1. Open your inventory and sell or drop unnecessary items',
      '2. Clear out old quest items you no longer need',
      '3. Remove duplicate or low-value items',
      '4. Save to local storage as a backup',
      '5. Try the cloud save operation again',
      '6. Consider splitting progress across multiple save files',
    ],
    prevention_tips: [
      'Regularly clean out your inventory',
      "Don't hoard unnecessary items",
      'Use multiple save files for different characters',
      'Save frequently to avoid large save files',
    ],
    when_to_contact_support: 'If save files are large despite minimal inventory',
    estimated_resolution_time: 'Immediate after reducing file size',
    severity_impact: 'Medium - Can save locally, cloud save unavailable',
  },

  [CloudErrorCode.DATA_INVALID]: {
    title: 'Invalid Save Data',
    message: "The save file contains data that doesn't match the expected format.",
    explanation:
      'This can happen if the save file was modified, corrupted, or created by a different version of the game. The system cannot safely process this data.',
    immediate_actions: [
      'Try loading a different save file',
      'Check if you have an unmodified backup',
      'Avoid modifying save files manually',
    ],
    detailed_steps: [
      '1. Do not attempt to load this save file',
      '2. Check for an unmodified backup copy',
      '3. Try loading an earlier save from the same session',
      "4. Verify you're using the correct game version",
      '5. If you modified the save file, restore the original',
      '6. Start a new game if no valid saves are available',
    ],
    prevention_tips: [
      "Don't modify save files manually",
      'Keep backup copies before experimenting',
      'Only use official game tools for save management',
      'Update the game regularly to maintain compatibility',
    ],
    when_to_contact_support: 'If save files become invalid without modification',
    estimated_resolution_time: 'Depends on backup availability',
    severity_impact: 'High - Save file cannot be used',
  },

  [CloudErrorCode.DATA_CORRUPTED]: {
    title: 'Data Corruption Detected',
    message: 'The save data has been corrupted and cannot be safely loaded.',
    explanation:
      'Data corruption can occur due to storage device issues, interrupted transfers, or system problems. The corrupted data cannot be safely used.',
    immediate_actions: [
      'Use a different save file',
      'Check for automatic backups',
      "Don't attempt to force-load corrupted data",
    ],
    detailed_steps: [
      '1. Immediately stop trying to load the corrupted save',
      '2. Check the backup save files available',
      '3. Look for cloud save backups from earlier sessions',
      '4. Try accessing local save files instead',
      '5. If available, restore from an automatic backup',
      '6. Consider starting fresh if no good backups exist',
    ],
    prevention_tips: [
      'Use multiple save slots regularly',
      "Don't force-quit during save operations",
      'Ensure your device has adequate storage space',
      'Keep devices and software updated',
    ],
    when_to_contact_support: 'If corruption happens frequently',
    estimated_resolution_time: 'Immediate with good backups',
    severity_impact: 'Critical - Data loss likely',
  },

  [CloudErrorCode.DATA_CHECKSUM_MISMATCH]: {
    title: 'Data Integrity Check Failed',
    message: 'The save file failed our security verification and may have been tampered with.',
    explanation:
      "Every save file has a security signature to ensure it hasn't been modified inappropriately. This file's signature doesn't match, so it cannot be loaded for security reasons.",
    immediate_actions: [
      'Use an original, unmodified save file',
      'Check for a backup copy',
      'Avoid using modified save files',
    ],
    detailed_steps: [
      '1. Do not attempt to load this save file',
      '2. If you have an original backup, use that instead',
      '3. Check if you accidentally loaded a modified save',
      "4. Verify you're using official game clients only",
      '5. Scan your device for malware that might modify files',
      '6. Start a new game if no valid saves are available',
    ],
    prevention_tips: [
      'Only use official game software',
      "Don't use save file editors or cheats",
      'Keep your device secure from malware',
      "Don't share save files between different accounts",
    ],
    when_to_contact_support: 'If unmodified saves consistently fail verification',
    estimated_resolution_time: 'Immediate with valid save files',
    severity_impact: 'High - Cannot use this save file',
  },

  [CloudErrorCode.DATA_VERSION_CONFLICT]: {
    title: 'Save Version Mismatch',
    message: 'This save file was created with a different version of the game.',
    explanation:
      'The save file format has changed between game versions. This save file was created with a newer or incompatible version and cannot be loaded safely.',
    immediate_actions: [
      'Update your game to the latest version',
      'Use saves created with your current version',
      'Check for version-specific save files',
    ],
    detailed_steps: [
      '1. Check your current game version in settings',
      '2. Update to the latest version if available',
      '3. Try loading the save file again after updating',
      "4. If updating isn't possible, use saves created with your version",
      '5. Look for save files with compatible version numbers',
      '6. Consider starting fresh with the new version',
    ],
    prevention_tips: [
      'Keep your game updated regularly',
      'Be careful when using saves from other players',
      'Back up saves before major game updates',
      'Check version compatibility before loading saves',
    ],
    when_to_contact_support: 'If save files become incompatible after official updates',
    estimated_resolution_time: 'Usually resolved after game update',
    severity_impact: 'Medium - May need to update or start fresh',
  },

  [CloudErrorCode.SYNC_CONFLICT]: {
    title: 'Save Sync Conflict',
    message: 'There are conflicting versions of your save file that need to be resolved.',
    explanation:
      'This happens when the same save slot has been modified on different devices or sessions. You need to choose which version to keep.',
    immediate_actions: [
      'Choose which version has your latest progress',
      'Download both versions to compare them',
      'Make a decision to avoid losing progress',
    ],
    detailed_steps: [
      '1. Review the details of both conflicting saves',
      '2. Check the timestamps to see which is more recent',
      '3. Compare progress levels, items, and achievements',
      '4. Download both saves locally as backups',
      '5. Choose the version with your preferred progress',
      '6. Confirm your choice to resolve the conflict',
    ],
    prevention_tips: [
      'Always sync before playing on a different device',
      "Don't play on multiple devices simultaneously",
      'Use different save slots for different devices',
      'Wait for sync to complete before switching devices',
    ],
    when_to_contact_support: 'If conflicts happen frequently with single-device usage',
    estimated_resolution_time: 'Immediate after choosing preferred version',
    severity_impact: 'Medium - Need to choose between save versions',
  },

  [CloudErrorCode.SYNC_INTERRUPTED]: {
    title: 'Sync Interrupted',
    message: 'The save synchronization was interrupted and needs to be restarted.',
    explanation:
      'The sync process was stopped due to connection issues, device sleep, or other interruptions. The operation needs to be completed to ensure your data is safely stored.',
    immediate_actions: [
      'Check your internet connection',
      'Try the sync operation again',
      'Make sure your device stays active during sync',
    ],
    detailed_steps: [
      '1. Verify your internet connection is stable',
      "2. Make sure your device won't go to sleep during sync",
      '3. Close other bandwidth-heavy applications',
      '4. Start the sync operation again',
      '5. Keep the game open and active during sync',
      "6. Wait for the 'Sync Complete' confirmation",
    ],
    prevention_tips: [
      'Ensure stable internet before starting sync',
      'Keep your device plugged in during long sync operations',
      "Don't switch apps during sync",
      'Sync regularly in smaller batches',
    ],
    when_to_contact_support: 'If sync consistently fails despite stable connection',
    estimated_resolution_time: 'Usually immediate on retry with stable connection',
    severity_impact: 'Low - Can retry the operation',
  },

  [CloudErrorCode.SYNC_PARTIAL_FAILURE]: {
    title: 'Partial Sync Failure',
    message: 'Some of your save files synced successfully, but others failed.',
    explanation:
      'This mixed result typically happens due to network issues, file size problems, or server capacity limits affecting some files but not others.',
    immediate_actions: [
      'Review which files failed to sync',
      'Try syncing the failed files individually',
      'Check for specific error messages',
    ],
    detailed_steps: [
      '1. Open the sync status report to see which files failed',
      '2. Note any specific error messages for failed files',
      '3. Try syncing the failed files one at a time',
      '4. Check if failed files are too large or corrupted',
      '5. Ensure stable internet connection',
      '6. Retry the complete sync operation if needed',
    ],
    prevention_tips: [
      'Sync files regularly in smaller batches',
      'Monitor file sizes to avoid oversized saves',
      'Maintain stable internet during sync operations',
      'Address individual file issues promptly',
    ],
    when_to_contact_support: 'If specific files consistently fail to sync',
    estimated_resolution_time: 'Variable depending on specific issues',
    severity_impact: 'Medium - Some saves may not be backed up',
  },

  [CloudErrorCode.OPERATION_CANCELLED]: {
    title: 'Operation Cancelled',
    message: 'The operation was cancelled before it could complete.',
    explanation:
      'This can happen if you cancelled the operation manually, if the app was closed, or if the system cancelled it due to resource constraints.',
    immediate_actions: [
      'Try the operation again if you want to complete it',
      'Make sure you have enough time for the operation',
      'Ensure your device has adequate resources',
    ],
    detailed_steps: [
      '1. If you cancelled intentionally, no action needed',
      '2. If cancelled unintentionally, restart the operation',
      '3. Ensure your device has enough storage space',
      '4. Close other resource-heavy applications',
      '5. Make sure your device is plugged in for long operations',
      "6. Don't switch apps during critical operations",
    ],
    prevention_tips: [
      'Be patient with long operations',
      'Ensure adequate device resources before starting',
      "Don't multitask during critical save operations",
      'Keep device charged for lengthy processes',
    ],
    when_to_contact_support: 'If operations cancel automatically without user action',
    estimated_resolution_time: 'Immediate on retry',
    severity_impact: 'Low - Can retry the operation',
  },

  [CloudErrorCode.OPERATION_TIMEOUT]: {
    title: 'Operation Timeout',
    message: 'The operation took longer than expected and was automatically cancelled.',
    explanation:
      'To prevent indefinite waiting and potential data issues, operations are cancelled if they take too long. This usually indicates connection or server performance issues.',
    immediate_actions: [
      'Check your internet connection speed',
      'Try the operation again',
      'Consider using a faster connection',
    ],
    detailed_steps: [
      '1. Test your internet connection speed',
      '2. Close other applications using bandwidth',
      '3. Try the operation during off-peak hours',
      '4. Use a wired connection instead of WiFi if possible',
      '5. Break large operations into smaller parts',
      '6. Contact support if timeouts persist with good connection',
    ],
    prevention_tips: [
      'Use fast, stable internet connections',
      'Perform large operations during off-peak times',
      'Break large saves into smaller chunks',
      'Monitor connection quality before starting',
    ],
    when_to_contact_support: 'If timeouts happen consistently with fast internet',
    estimated_resolution_time: 'Usually immediate with better connection',
    severity_impact: 'Low - Can retry with better conditions',
  },

  [CloudErrorCode.OPERATION_FAILED]: {
    title: 'Operation Failed',
    message: 'The requested operation could not be completed due to an unexpected error.',
    explanation:
      'This is a general error that can have various causes including server issues, corrupted data, or system problems. More specific information may be available in the error details.',
    immediate_actions: [
      'Try the operation again',
      'Check for more specific error information',
      'Ensure all requirements are met',
    ],
    detailed_steps: [
      '1. Review any additional error details provided',
      '2. Ensure you meet all requirements for the operation',
      '3. Check that your account is in good standing',
      '4. Verify you have necessary permissions',
      '5. Try the operation again after a brief wait',
      '6. Contact support if the problem persists',
    ],
    prevention_tips: [
      'Keep your account and game updated',
      'Follow proper procedures for operations',
      'Maintain good account standing',
      'Report persistent issues promptly',
    ],
    when_to_contact_support: 'If operation fails repeatedly without clear cause',
    estimated_resolution_time: 'Variable depending on specific cause',
    severity_impact: 'Variable - depends on the specific operation',
  },

  [CloudErrorCode.CONFIG_INVALID]: {
    title: 'Configuration Error',
    message:
      "There's a problem with the game's configuration that prevents cloud features from working.",
    explanation:
      "The game's settings or configuration files have invalid or missing information required for cloud operations. This typically requires technical intervention.",
    immediate_actions: [
      'Try restarting the game',
      'Check for game updates',
      'Reset to default settings if available',
    ],
    detailed_steps: [
      '1. Close and restart the game completely',
      '2. Check for and install any available game updates',
      "3. Look for a 'Reset to Defaults' option in settings",
      "4. Clear the game's cache or temporary files",
      "5. Reinstall the game if other steps don't work",
      '6. Contact support for configuration assistance',
    ],
    prevention_tips: [
      "Don't manually edit configuration files",
      'Keep the game updated',
      'Use official game installers only',
      'Back up working configurations',
    ],
    when_to_contact_support: 'If configuration issues persist after basic troubleshooting',
    estimated_resolution_time: 'Usually resolved after restart or update',
    severity_impact: 'High - Cloud features completely unavailable',
  },

  [CloudErrorCode.CONFIG_MISSING]: {
    title: 'Missing Configuration',
    message: 'Required configuration files are missing and need to be restored.',
    explanation:
      'Essential configuration files that enable cloud features are missing. This can happen due to incomplete installation, file corruption, or accidental deletion.',
    immediate_actions: [
      'Restart the game to regenerate missing files',
      'Check for game updates',
      'Reinstall if necessary',
    ],
    detailed_steps: [
      '1. Close the game completely',
      '2. Restart the game to auto-regenerate missing files',
      "3. If that doesn't work, check for game updates",
      '4. Verify the game installation integrity',
      '5. Reinstall the game if files remain missing',
      '6. Contact support if problems persist after reinstall',
    ],
    prevention_tips: [
      "Don't delete game files manually",
      'Keep the game properly installed',
      'Use official uninstall procedures when needed',
      'Back up game installations before major changes',
    ],
    when_to_contact_support: 'If files remain missing after reinstallation',
    estimated_resolution_time: 'Usually immediate after restart or reinstall',
    severity_impact: 'High - Cloud features unavailable until fixed',
  },

  [CloudErrorCode.UNKNOWN]: {
    title: 'Unknown Error',
    message: "An unexpected error occurred that we haven't seen before.",
    explanation:
      "This error doesn't match any known issues. It could be due to new problems, unique system configurations, or rare edge cases that need investigation.",
    immediate_actions: [
      'Try the operation again',
      'Restart the game',
      'Note exactly what you were doing when this happened',
    ],
    detailed_steps: [
      '1. Note exactly what you were doing when the error occurred',
      '2. Try the same operation again to see if it repeats',
      '3. Restart the game and try again',
      '4. Check if the error happens with other operations',
      '5. Take a screenshot of any error messages',
      '6. Contact support with detailed information about the error',
    ],
    prevention_tips: [
      'Keep detailed notes when encountering unknown errors',
      'Report unusual errors to help improve the game',
      'Save your progress frequently as a precaution',
    ],
    when_to_contact_support: 'Always report unknown errors to help us improve the game',
    estimated_resolution_time: 'Variable - may require investigation',
    severity_impact: 'Variable - depends on the specific unknown issue',
  },

  [CloudErrorCode.INTERNAL]: {
    title: 'Internal System Error',
    message:
      "There's an internal problem with our systems that's preventing the operation from completing.",
    explanation:
      'This indicates a problem on our end rather than with your device or connection. Our technical team needs to address this server-side issue.',
    immediate_actions: [
      'Wait a few minutes and try again',
      'Check our status page for known issues',
      'Continue with local saves in the meantime',
    ],
    detailed_steps: [
      '1. Wait 5-10 minutes before trying the operation again',
      '2. Check our official status page or social media for outage reports',
      '3. Try accessing other cloud features to see if they work',
      '4. Save your progress locally as a backup',
      '5. Try again in 30 minutes if the issue persists',
      '6. Report the issue if it continues for over an hour',
    ],
    prevention_tips: [
      'Keep local save backups during server issues',
      'Follow our official channels for service status updates',
      'Be patient during server maintenance periods',
    ],
    when_to_contact_support: 'If internal errors persist for more than an hour',
    estimated_resolution_time: 'Depends on the severity of the internal issue',
    severity_impact: 'Medium to High - Service disruption until resolved',
  },
};

/**
 * Get comprehensive user-friendly error information
 */
export function getUserFriendlyErrorInfo(error: CloudError): UserFriendlyErrorData {
  return ERROR_MESSAGE_DATABASE[error.code] || ERROR_MESSAGE_DATABASE[CloudErrorCode.UNKNOWN];
}

/**
 * Get contextual error message based on user situation
 */
export function getContextualErrorMessage(
  error: CloudError,
  context?: {
    isFirstTime?: boolean;
    hasLocalSaves?: boolean;
    isOnMobile?: boolean;
    operationType?: 'save' | 'load' | 'sync' | 'delete';
  }
): string {
  const errorInfo = getUserFriendlyErrorInfo(error);
  let message = errorInfo.message;

  if (context) {
    if (context.isFirstTime && error.code === CloudErrorCode.AUTH_REQUIRED) {
      message =
        "Welcome! To use cloud saves and sync your progress across devices, you'll need to create a free account. This keeps your saves secure and accessible from anywhere.";
    }

    if (
      context.hasLocalSaves &&
      (error.code === CloudErrorCode.NETWORK_UNAVAILABLE ||
        error.code === CloudErrorCode.NETWORK_ERROR)
    ) {
      message += " Don't worry - your local saves are safe and you can continue playing offline.";
    }

    if (context.isOnMobile && error.code === CloudErrorCode.NETWORK_TIMEOUT) {
      message += ' Consider switching to WiFi for better performance with cloud saves.';
    }

    if (context.operationType === 'save' && error.code === CloudErrorCode.STORAGE_QUOTA_EXCEEDED) {
      message =
        "Your cloud storage is full. Before saving this progress, you'll need to delete some older saves to make room.";
    }
  }

  return message;
}

/**
 * Get priority recovery actions based on error severity
 */
export function getPriorityRecoveryActions(error: CloudError, maxActions: number = 3): string[] {
  const errorInfo = getUserFriendlyErrorInfo(error);

  if (error.severity === ErrorSeverity.CRITICAL) {
    return errorInfo.immediate_actions.slice(0, maxActions);
  }

  return errorInfo.immediate_actions.slice(0, maxActions);
}

/**
 * Get estimated resolution time in user-friendly format
 */
export function getEstimatedResolutionTime(error: CloudError): string {
  const errorInfo = getUserFriendlyErrorInfo(error);
  return errorInfo.estimated_resolution_time;
}

/**
 * Check if user should contact support for this error
 */
export function shouldContactSupport(
  error: CloudError,
  hasTriedBasicSteps: boolean = false
): {
  shouldContact: boolean;
  reason: string;
} {
  const errorInfo = getUserFriendlyErrorInfo(error);

  if (error.severity === ErrorSeverity.CRITICAL) {
    return {
      shouldContact: true,
      reason: 'This is a critical error that requires support assistance.',
    };
  }

  if (hasTriedBasicSteps) {
    return {
      shouldContact: true,
      reason: errorInfo.when_to_contact_support,
    };
  }

  return {
    shouldContact: false,
    reason: 'Try the suggested recovery steps first.',
  };
}

/**
 * Generate a complete troubleshooting guide for an error
 */
export function generateTroubleshootingGuide(
  error: CloudError,
  context?: {
    isFirstTime?: boolean;
    hasLocalSaves?: boolean;
    isOnMobile?: boolean;
    operationType?: 'save' | 'load' | 'sync' | 'delete';
  }
): {
  title: string;
  description: string;
  immediateSteps: string[];
  detailedSteps: string[];
  preventionTips: string[];
  supportInfo: string;
  estimatedTime: string;
} {
  const errorInfo = getUserFriendlyErrorInfo(error);

  return {
    title: errorInfo.title,
    description: getContextualErrorMessage(error, context),
    immediateSteps: errorInfo.immediate_actions,
    detailedSteps: errorInfo.detailed_steps,
    preventionTips: errorInfo.prevention_tips,
    supportInfo: errorInfo.when_to_contact_support,
    estimatedTime: errorInfo.estimated_resolution_time,
  };
}

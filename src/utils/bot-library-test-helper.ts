/**
 * Bot Library Test Helper
 *
 * Use these functions in browser console to test the Bot Library feature
 */

// Test if Blockly is available
export const testBlocklyAvailability = () => {
    const Blockly = (window as any).Blockly;
    console.log('Blockly available:', !!Blockly);
    console.log('derivWorkspace available:', !!Blockly?.derivWorkspace);
    console.log('mainWorkspace available:', !!Blockly?.mainWorkspace);
    console.log('Xml parser available:', !!Blockly?.Xml);
    return {
        hasBlockly: !!Blockly,
        hasDerivWorkspace: !!Blockly?.derivWorkspace,
        hasMainWorkspace: !!Blockly?.mainWorkspace,
        hasXmlParser: !!Blockly?.Xml,
    };
};

// Test loading a bot directly
export const testLoadBot = async (xmlUrl: string) => {
    try {
        console.log('Fetching bot from:', xmlUrl);
        const response = await fetch(xmlUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const xmlText = await response.text();
        console.log('XML fetched successfully, length:', xmlText.length);

        const Blockly = (window as any).Blockly;
        const workspace = Blockly?.derivWorkspace || Blockly?.mainWorkspace;

        if (!workspace) {
            throw new Error('No workspace available');
        }

        console.log('Parsing XML...');
        const xmlDom = Blockly.Xml.textToDom(xmlText);
        console.log('XML parsed successfully');

        console.log('Clearing workspace...');
        workspace.clear();

        console.log('Loading blocks into workspace...');
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        console.log('✅ Bot loaded successfully!');
        return { success: true };
    } catch (error) {
        console.error('❌ Error loading bot:', error);
        return { success: false, error };
    }
};

// List all available bots
export const listAllBots = () => {
    // This would need to import BOT_LIBRARY from constants
    console.log('To see all bots, check: src/constants/bot-library.ts');
    console.log('Total bots: 87');
    console.log('Categories: All, Digits, Rise/Fall, Volatility, Touch, Flex Period, Auto Bot, Premium, Market Trend');
};

// Test a specific bot by name
export const testBotByName = async (name: string) => {
    const testUrl = `/bots/Free-Dbots/${name}`;
    console.log(`Testing bot: ${name}`);
    return await testLoadBot(testUrl);
};

// Quick test with a simple bot
export const quickTest = () => {
    return testBotByName('1 tick DIgit Over 2.xml');
};

// Console helper message
console.log(`
🤖 Bot Library Test Helpers Loaded!

Available functions:
- testBlocklyAvailability() - Check if Blockly is ready
- testLoadBot(xmlUrl) - Test loading a specific bot by URL
- testBotByName(name) - Test loading a bot by filename
- quickTest() - Quick test with a simple bot
- listAllBots() - Show bot library info

Example usage:
  testBlocklyAvailability()
  quickTest()
  testBotByName('Digit Over 3.xml')
`);

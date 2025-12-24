const fs = require('fs');
const path = require('path');

// Configuration
const BOTS_DIR = path.join(__dirname, '..', 'bots', 'Free-Dbots');
const BACKUP_DIR = path.join(__dirname, '..', 'bots', 'Free-Dbots-Backup');

// Patterns to remove or replace
const PATTERNS_TO_REMOVE = [
    // Email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,

    // Telegram references
    /T\.me\/[a-zA-Z0-9_]+/gi,
    /https?:\/\/t\.me\/[a-zA-Z0-9_]+/gi,
    /telegram[:\s]+[@a-zA-Z0-9_/.]+/gi,

    // YouTube references
    /https?:\/\/(?:www\.)?youtube\.com\/[a-zA-Z0-9_\-?=&/]+/gi,
    /YouTube[:\s]+[a-zA-Z0-9\s]+/gi,

    // Website references
    /Provenbinarybot\.com/gi,

    // Specific creator mentions
    /Ultimate Trading Scripts/gi,
    /Ultimate Trader/gi,
    /TRADE-GENIC-GURU/gi,
    /TradeGenicGuru/gi,
    /Binaryboss101/gi,
    /binaryboss101/gi,
    /Investment SpeedUP/gi,
    /MKZ ROBOTICA/gi,
    /MKZ ROBÓTICA/gi,
    /Caleb-FX/gi,
    /rudika\.fx/gi,
    /FRUITFELLA/gi,
];

// Portuguese to English translations
const PORTUGUESE_TRANSLATIONS = {
    'Próxima condição Trade': 'Next Trade Condition',
    'Perda máxima aceita': 'Maximum Acceptable Loss',
    'Aposta inicial': 'Initial Stake',
    'Espectativa de Lucro': 'Profit Expectation',
    'Aposta ao vencer': 'Winning Stake',
    '💱SELECIONE A MOEDA': '💱SELECT CURRENCY',
    SENHA: 'PASSWORD',
    'DIGITE A SENHA DO USUÁRIO': 'ENTER USER PASSWORD',
    '📈META DE LUCRO': '📈PROFIT TARGET',
    '⛔MÁXIMO DE PERDAS': '⛔MAXIMUM LOSSES',
    'ROBO PROGRAMADO PARA OPERAÇÕES NO MERCADO FINANCEIRO': 'BOT PROGRAMMED FOR FINANCIAL MARKET OPERATIONS',
    '⚠️ATENÇÃO⚠️': '⚠️ATTENTION⚠️',
};

// Phrases to completely remove
const PHRASES_TO_REMOVE = [
    /For More Updated binary bots go to[^<]*/gi,
    /Get More bots from[^<]*/gi,
    /Bot updated By[^<]*/gi,
    /Join & Subscribe To[^<]*/gi,
    /Subscribe To get Weekly updated bots[^<]*/gi,
    /Search Ultimate trading tools on Youtube[^<]*/gi,
    /Congratulations! You Have Achieved Your Total Profit.*?For More Premium Trading Tools/gi,
    /Share With me on[^<]*/gi,
    /Welcome To Caleb-FX[^<]*/gi,
    /by rudika\.fx@gmail\.com/gi,
    /Join Our Telegram Channel[^<]*/gi,
];

function cleanXMLContent(content) {
    let cleanedContent = content;

    // Remove all matching patterns
    PATTERNS_TO_REMOVE.forEach(pattern => {
        cleanedContent = cleanedContent.replace(pattern, '');
    });

    // Remove specific phrases
    PHRASES_TO_REMOVE.forEach(pattern => {
        cleanedContent = cleanedContent.replace(pattern, '');
    });

    // Translate Portuguese to English
    Object.entries(PORTUGUESE_TRANSLATIONS).forEach(([portuguese, english]) => {
        const regex = new RegExp(portuguese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleanedContent = cleanedContent.replace(regex, english);
    });

    // Clean up empty text blocks that may have been created
    cleanedContent = cleanedContent.replace(
        /<field name="TEXT">\s*<\/field>/gi,
        '<field name="TEXT">Trading Bot</field>'
    );
    cleanedContent = cleanedContent.replace(/<field name="TEXT">\s{2,}/gi, '<field name="TEXT">');

    // Remove comments containing promotional content
    cleanedContent = cleanedContent.replace(
        /<comment[^>]*>.*?(telegram|youtube|email|@gmail|provenbinarybot).*?<\/comment>/gis,
        ''
    );

    // Clean up double spaces and trim
    cleanedContent = cleanedContent.replace(/\s{2,}/g, ' ');

    return cleanedContent;
}

function cleanAllBots() {
    console.log('🚀 Starting bot XML cleanup...\n');

    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log('✅ Created backup directory\n');
    }

    // Get all XML files
    const files = fs.readdirSync(BOTS_DIR).filter(file => file.toLowerCase().endsWith('.xml'));

    console.log(`Found ${files.length} XML files to process\n`);

    let processedCount = 0;
    let errorCount = 0;

    files.forEach((file, index) => {
        try {
            const filePath = path.join(BOTS_DIR, file);
            const backupPath = path.join(BACKUP_DIR, file);

            // Read original content
            const originalContent = fs.readFileSync(filePath, 'utf8');

            // Backup original file (only if not already backed up)
            if (!fs.existsSync(backupPath)) {
                fs.copyFileSync(filePath, backupPath);
            }

            // Clean content
            const cleanedContent = cleanXMLContent(originalContent);

            // Write cleaned content
            fs.writeFileSync(filePath, cleanedContent, 'utf8');

            processedCount++;

            // Show progress
            if ((index + 1) % 10 === 0 || index + 1 === files.length) {
                console.log(`✅ Processed ${index + 1}/${files.length} files`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
            errorCount++;
        }
    });

    console.log('\n' + '='.repeat(50));
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`✅ Successfully processed: ${processedCount} files`);
    console.log(`❌ Errors: ${errorCount} files`);
    console.log(`💾 Backups saved to: ${BACKUP_DIR}\n`);
    console.log('📝 All bots are now branded as your own work!');
    console.log('='.repeat(50) + '\n');
}

// Run the cleanup
cleanAllBots();

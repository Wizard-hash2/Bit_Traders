const fs = require('fs');
const path = require('path');

// Configuration
const BOTS_DIR = path.join(__dirname, '..', 'bots', 'Free-Dbots');
const BACKUP_DIR = path.join(__dirname, '..', 'bots', 'Free-Dbots-Backup');
const BRAND_NAME = process.env.BRAND_NAME || 'Bit Traders';

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

// Portuguese to English translations (commonly seen in shared bots)
const PORTUGUESE_TRANSLATIONS = {
    // Clarity & professional instructions
    'Próxima condição Trade': 'Next Trade Condition',
    'Perda máxima aceita': 'Maximum Acceptable Loss',
    'Aposta inicial': 'Initial Stake',
    'Espectativa de Lucro': 'Profit Expectation',
    'EXPECTATIVA DE LUCRO': 'PROFIT EXPECTATION',
    'Aposta ao vencer': 'Winning Stake',
    '💱SELECIONE A MOEDA': '💱SELECT CURRENCY',
    'PARABÉNS TRADER': 'CONGRATULATIONS TRADER',
    PARABÉNS: 'CONGRATULATIONS',
    'Chega por Hoje': 'STOP TRADING TODAY',
    'Chega por hoje': 'Stop Trading Today',
    'Respeite sua Banca': 'Protect Your Bankroll',
    'ATINGIU SUA META': 'REACHED YOUR TARGET',
    'TOTAL DE PERDAS': 'TOTAL LOSSES',

    // Counter & loss tracking clarity
    'Contador-perdas': 'Loss Counter',
    'Contador de perdas': 'Loss Counter',
    'Quantas perdas antes do martingale': 'Losses Before Martingale',

    // Victory/Loss clarity
    Vitoria: 'Victory',
    vitoria: 'victory',
    Derrota: 'Loss',
    derrota: 'loss',
    Ganhou: 'Won',
    Perdeu: 'Lost',

    // Standard translations (preserved from before)
    SENHA: 'PASSWORD',
    'DIGITE A SENHA DO USUÁRIO': 'ENTER USER PASSWORD',
    'DIGITE A PASSWORD DO USUÁRIO': 'ENTER USER PASSWORD',
    '📈META DE LUCRO': '📈PROFIT TARGET',
    '⛔MÁXIMO DE PERDAS': '⛔MAXIMUM LOSSES',
    'ROBO PROGRAMADO PARA OPERAÇÕES NO MERCADO FINANCEIRO': 'BOT PROGRAMMED FOR FINANCIAL MARKET OPERATIONS',
    OPERAÇÕES: 'OPERATIONS',
    '⚠️ATENÇÃO⚠️': '⚠️ATTENTION⚠️',
    'VALOR INICIAL': 'INITIAL AMOUNT',
    'VALOR DO CONTRATO': 'CONTRACT AMOUNT',
    'COPY VALOR DE CONTRATO': 'COPY CONTRACT AMOUNT',
    'NUMERO DE EXECUÇÕES': 'NUMBER OF EXECUTIONS',
    'LIMITE DE PERDAS': 'LOSS LIMIT',
    MOEDA: 'CURRENCY',
    'BB DESVIO': 'BB DEVIATION',
    'BB PERÍODO': 'BB PERIOD',
    'COMPRA EFETUADA': 'PURCHASE EXECUTED',
    'CONTRATO MÍNIMO INICIAL': 'MINIMUM INITIAL CONTRACT',
    'ROBO NÃO ACEITA VÍRGULA SOMENTE PONTO EXEMPLO 0.35': 'BOT DOES NOT ACCEPT COMMA, ONLY DOT e.g. 0.35',
    'QUANTIDADE MÁXIMA DE PERDAS SEGUIDAS': 'MAXIMUM CONSECUTIVE LOSSES',
    'OPERAÇÕES CONCLUIDAS': 'OPERATIONS COMPLETED',
    'PERDEU TENTE NOVAMENTE MAIS TARDE': 'YOU LOST, TRY AGAIN LATER',
    CALCULANDO: 'CALCULATING',
    'ROBO ': 'BOT ',
    'ROBÔ ': 'BOT ',
    GRAFICOS: 'CHARTS',
    OPERAÇÃO: 'OPERATION',
    'ÍNDICE DE VOLATILIDADE 100': 'VOLATILITY INDEX 100',
    'SUGESTÃO DE ENTRADA INICIAL': 'SUGGESTED INITIAL ENTRY',
    'BOA SORTE': 'GOOD LUCK',
    DOLAR: 'DOLLAR',
    'TIPO DE NEGOCIAÇÃO CALL / PUT': 'TRADE TYPE CALL / PUT',
    'O BOT FAZ UMA LEITURA DOS GRAFICOS ANTES DE EFETUAR A OPERAÇÃO PARA IDENTIFICAR QUAL O MELHOR MOMENTO DE AQUISIÇÃO':
        'THE BOT ANALYZES THE CHARTS BEFORE EXECUTING TO IDENTIFY THE BEST ENTRY TIME',
    'ANÁLISE EM EXECUÇÃO': 'ANALYSIS IN PROGRESS',
    SEGURANÇA: 'SAFETY',
    '"SELECIONE A CURRENCY"': '"SELECT CURRENCY"',
    'DIGITE (1) PARA': 'ENTER (1) FOR',
    'OU (2) PARA': 'OR (2) FOR',
    CRIPTOMOEDA: 'CRYPTOCURRENCY',
    CRIPTOCURRENCY: 'CRYPTOCURRENCY',
    'PROFIT HAS BEN MADE': 'PROFIT HAS BEEN MADE',
    'ROBO MKZ PREMIUM V5': 'MKZ PREMIUM BOT V5',
    'Meta do Dia': 'Daily Target',
    Meta: 'Target',
    'Stake Inicial': 'Initial Stake',
    'Seu Lucro': 'Your Profit',
    'Mais bots no Canal Bot Binary Gratis': 'More bots available',
    'Bot Criado por': 'Bot created by',
    'VAMOS COMEÇAR': "LET'S START",
};

// Spanish to English translations (lightweight, common UI phrases)
const SPANISH_TRANSLATIONS = {
    'SELECCIONAR MONEDA': 'SELECT CURRENCY',
    CONTRASEÑA: 'PASSWORD',
    'INGRESE LA CONTRASEÑA': 'ENTER USER PASSWORD',
    'META DE GANANCIA': 'PROFIT TARGET',
    'PÉRDIDAS MÁXIMAS': 'MAXIMUM LOSSES',
};

// Indonesian to English translations (common UI phrases)
const INDONESIAN_TRANSLATIONS = {
    'PILIH MATA UANG': 'SELECT CURRENCY',
    'KATA SANDI': 'PASSWORD',
    'MASUKKAN KATA SANDI': 'ENTER USER PASSWORD',
    'TARGET KEUNTUNGAN': 'PROFIT TARGET',
    'KERUGIAN MAKSIMUM': 'MAXIMUM LOSSES',
};

// Russian to English (common UI phrases)
const RUSSIAN_TRANSLATIONS = {
    'ВЫБЕРИТЕ ВАЛЮТУ': 'SELECT CURRENCY',
    ПАРОЛЬ: 'PASSWORD',
    'ВВЕДИТЕ ПАРОЛЬ': 'ENTER USER PASSWORD',
    'ЦЕЛЬ ПРИБЫЛИ': 'PROFIT TARGET',
    'МАКСИМАЛЬНЫЕ ПОТЕРИ': 'MAXIMUM LOSSES',
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

function applyDictionaryTranslations(text, dictionary) {
    let result = text;
    Object.entries(dictionary).forEach(([from, to]) => {
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        result = result.replace(regex, to);
    });
    return result;
}

function ensureBrandedHeader(text) {
    // Insert a branded XML comment once per file
    const banner = `<!-- Cleaned and branded by ${BRAND_NAME} -->`;
    if (text.includes(banner)) return text;

    if (/<xml[^>]*>/i.test(text)) {
        return text.replace(/<xml[^>]*>/i, match => `${match}\n    ${banner}`);
    }
    // Fallback: prefix banner
    return `${banner}\n${text}`;
}

function brandDisplayText(content) {
    // Append brand to visible TEXT fields conservatively
    return content.replace(/(<field name="TEXT">)([^<]{3,200}?)(<\/field>)/gim, (m, p1, text, p3) => {
        const current = text.trim();
        if (!current) return m;
        // Avoid duplicating brand or altering placeholders/code-like strings
        if (new RegExp(`\\b${BRAND_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(current)) return m;
        if (/[<>]/.test(current)) return m; // likely markup
        if (/\{\{?|%s|%d|\$\{|\}\}/i.test(current)) return m; // templating tokens
        if (/^[-+*/=<>\d\s.,:;()]+$/.test(current)) return m; // mostly symbols/numbers
        const joined = `${current} • ${BRAND_NAME}`;
        return `${p1}${joined}${p3}`;
    });
}

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

    // Translate common phrases to English using multiple dictionaries
    cleanedContent = applyDictionaryTranslations(cleanedContent, PORTUGUESE_TRANSLATIONS);
    cleanedContent = applyDictionaryTranslations(cleanedContent, SPANISH_TRANSLATIONS);
    cleanedContent = applyDictionaryTranslations(cleanedContent, INDONESIAN_TRANSLATIONS);
    cleanedContent = applyDictionaryTranslations(cleanedContent, RUSSIAN_TRANSLATIONS);

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

    // Brand visible text fields conservatively
    cleanedContent = brandDisplayText(cleanedContent);

    // Add branded header banner
    cleanedContent = ensureBrandedHeader(cleanedContent);

    // Clean up excessive spacing
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

import { getModel } from "./client";
import { GeminiTextResult } from "./types";
import { parseGeminiJson } from "../../utils/parseGeminiJson";
import { retry } from "../../utils/retry";
import { GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { config } from "../../config";
import logger from "../../utils/logger";

const TEXT_PROMPT = `You are a content moderator for Fayrouza, an Islamic marketplace operating in Egypt and Saudi Arabia. Analyze ONLY the text content of this ad. You will NOT see the image - another AI is analyzing that separately.

AD TEXT TO ANALYZE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: {{TITLE}}
Description: {{DESCRIPTION}}
Price: {{PRICE}} {{CURRENCY}}
Category: {{CATEGORY}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REJECTION CRITERIA - Flag as REJECT if text mentions:

1. HARAM PRODUCTS (Arabic & English):
   - Alcoholic beverages (beer, wine, vodka, whiskey, spirits, liquor) — Arabic: خمر, كحول, بيرة, نبيذ, ويسكي, فودكا, براندي, جعة, عرق, مشروبات روحية
     * Egyptian brands/transliterations: ستلايت, أيبردرافت, فانيليا, كاسبر, زبيب, مصر جرمان
     * Saudi/Gulf brands/transliterations: شنكس, أراك, سميكم, بارون, دير كلاس, بلاك ليبل, أبسنت, شمبانيا, موسكوف, غراي غوز, جوني ووكر, جاك دانيال, هنيسي, ريمي مارتن, كونياك, فودكا, تكيلة, رم, جين
     * Arabic slang: عصير (when used as alcohol code), بيبسي (when clearly referring to alcohol), سفن أب (when clearly referring to alcohol)
   - Pork products (bacon, ham, pork chops, sausage with pork) — Arabic: خنزير, لحم خنزير, بانسيتا
   - Gambling items (poker chips, casino equipment, lottery tickets, dice games) — Arabic: قمار, كازينو, يانصيب, روليت, ماكينة قمار, مراهنات
   - Interest-based financial services (riba, payday loans, credit with interest) — Arabic: ربا, قرض بفائدة, تمويل بفائدة

2. WEAPONS & DANGEROUS ITEMS:
   - Firearms, guns, rifles, pistols, ammunition
   - Knives marketed as weapons (tactical, combat - kitchen knives are OK)
   - Explosives, fireworks, grenades, bombs
   - Tasers, pepper spray, brass knuckles

3. DRUGS & RELATED:
   - Illegal drugs (marijuana, cocaine, heroin, meth, etc.) — Arabic: حشيش, بانجو, أفيون, كوكايين, هيروين, مخدرات, ترامادول
   - Drug paraphernalia (bongs, pipes, rolling papers marketed for drugs)
   - Prescription medications sold without proper authorization
   - Vaping/e-cigarette products (electronic cigarettes, e-liquids, nicotine vapes)
   - NOTE: Traditional shisha/hookah tobacco (معسل, شيشة, أرجيلة, تبغ) is NOT vaping — do NOT reject it; flag it as REVIEW instead (see REVIEW CRITERIA)

4. ADULT/SEXUAL CONTENT:
   - Sexual products, adult toys, provocative items
   - Adult entertainment services
   - Suggestive or explicit language
   - Dating/hookup services

5. PROHIBITED SERVICES:
   - Fortune telling, tarot reading, astrology services — Arabic: سحر, شعوذة, دجل, قراءة طالع, تنجيم, رقية (when sold as paid service with false claims), طلسم, تميمة, حجاب (in superstitious context)
   - Magic, witchcraft, spell casting services — Arabic: سحر أسود, روحاني, جن, استحضار أرواح, فك سحر, عمل سحر
   - Services promoting shirk or un-Islamic practices
   - Nightclub, bar, or casino services

6. FRAUD & ILLEGAL:
   - Counterfeit goods explicitly stated (fake Rolex, replica designer)
   - Stolen items ("hot merchandise", "fell off a truck")
   - Pyramid schemes, MLM scams — Arabic: تسويق شبكي, هرمي, scheme
   - Fake documents, IDs, diplomas
   - Money laundering services
   - Riba/interest hidden in installment descriptions (watch for: "فائدة", "ربح مضمون", "عائد شهري")

7. MISREPRESENTATION:
   - Non-Islamic products misleadingly labeled as Islamic
   - Fake halal certifications
   - Items falsely claiming religious significance or barakah

REVIEW CRITERIA - Flag as REVIEW if:
   - Text is ambiguous or could have dual meanings
   - Price seems suspiciously low for high-value items
   - Category and title mismatch
   - Description is too short to make a clear determination
   - Medical/health products that need verification
   - Financial services that might involve riba but unclear
   - Products that could be legitimate or prohibited depending on context
   - Traditional shisha/hookah tobacco (معسل, شيشة, أرجيلة, تبغ للشيشة) — legal in Egypt and Saudi Arabia but debated among scholars; always flag as REVIEW, never REJECT

APPROVE CRITERIA - Flag as APPROVE if:
   - Product is clearly halal and permissible
   - Description is clear and honest
   - Price is reasonable for the category
   - No violations or concerns found
   - Standard marketplace items (phones, clothes, furniture, etc.)

IMPORTANT RULES:
- Be thorough but FAIR — do NOT reject legitimate products
- Kitchen knives, cooking wine (non-alcoholic), and decorative items are OK
- Weight loss supplements without haram ingredients are OK
- Traditional remedies without haram/illegal substances are OK
- Arabic transliterations of brands should be checked carefully
- Consider both Egyptian and Saudi/Gulf market contexts — some items legal but not Islamically permissible
- Saudi-specific: Saudi law is stricter than Egyptian law; items banned in KSA must also be flagged even if sometimes tolerated in Egypt
- Saudi-specific: مشروبات الطاقة / energy drinks are OK, but anything mixed with alcohol is not
- Saudi-specific:قمح (wheat) is OK, but watch for قمر (gambling) vs قمر الدين (apricot drink — OK)
- If a word has multiple meanings (e.g., "spirit"), check context before deciding

RESPOND WITH THIS EXACT JSON FORMAT (no extra text before or after):
\`\`\`json
{
  "text_decision": "approve|reject|review",
  "text_confidence": 85,
  "text_reasoning": "Clear explanation of your decision...",
  "text_violations": ["violation1", "violation2"],
  "text_concerns": ["concern1"]
}
\`\`\`

- text_confidence: 0-100 (how confident you are in your decision)
- text_violations: array of specific violations found (empty if none)
- text_concerns: array of concerns that warrant human attention (empty if none)`;

interface TextAnalysisInput {
  title: string;
  description: string;
  price: number;
  category: string;
}

export async function analyzeText(input: TextAnalysisInput): Promise<GeminiTextResult> {
  const prompt = TEXT_PROMPT
    .replace("{{TITLE}}", input.title)
    .replace("{{DESCRIPTION}}", input.description)
    .replace("{{PRICE}}", String(input.price))
    .replace("{{CURRENCY}}", config.marketplaceCurrency)
    .replace("{{CATEGORY}}", input.category);

  logger.debug("Starting text analysis", { title: input.title });

  const result = await retry(
    async () => {
      const model = getModel();
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      return parseGeminiJson<GeminiTextResult>(text);
    },
    {
      shouldRetry: (error: unknown) => {
        if (error instanceof GoogleGenerativeAIFetchError) {
          return error.status === 429 || error.status === 503;
        }
        return false;
      },
    }
  );

  logger.info("Text analysis complete", {
    decision: result.text_decision,
    confidence: result.text_confidence,
    violations: result.text_violations.length,
  });

  return result;
}

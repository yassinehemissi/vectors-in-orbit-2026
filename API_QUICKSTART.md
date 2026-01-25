# Quick Reference: Where to Put Your Summarization API Key

## 📍 Location: `.env` file in project root

Add these lines to your `.env` file:

```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=openai
SUMMARIZATION_API_KEY=sk-your-key-here
SUMMARIZATION_API_MODEL=gpt-3.5-turbo
```

## 🔑 Quick Setup Examples

### OpenAI (Recommended)
```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=openai
SUMMARIZATION_API_KEY=sk-proj-abc123...
SUMMARIZATION_API_MODEL=gpt-3.5-turbo
```

### Anthropic Claude
```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=anthropic
SUMMARIZATION_API_KEY=sk-ant-abc123...
SUMMARIZATION_API_MODEL=claude-3-haiku-20240307
```

### Together AI
```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=together
SUMMARIZATION_API_KEY=your-together-key
SUMMARIZATION_API_MODEL=meta-llama/Llama-2-7b-chat-hf
```

## ✅ That's It!

Once you add these to `.env`, the pipeline will automatically use the API for summarization.

See `API_CONFIGURATION.md` for detailed instructions.


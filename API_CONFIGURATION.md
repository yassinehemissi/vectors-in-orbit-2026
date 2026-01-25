# API-Based Summarization Configuration Guide

## Where to Put Your Summarization API Key

### Step 1: Add to `.env` File

Add these lines to your `.env` file in the project root:

```env
# Enable API-based summarization
USE_API_SUMMARIZATION=true

# Choose your provider
SUMMARIZATION_API_PROVIDER=openai  # Options: openai, anthropic, together, groq

# Your API key (REQUIRED)
SUMMARIZATION_API_KEY=sk-your-api-key-here

# Model to use
SUMMARIZATION_API_MODEL=gpt-3.5-turbo
```

### Step 2: Supported Providers

#### OpenAI
```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=openai
SUMMARIZATION_API_KEY=sk-...
SUMMARIZATION_API_MODEL=gpt-3.5-turbo  # or gpt-4, gpt-4-turbo
```

**Get API Key:** https://platform.openai.com/api-keys

#### Anthropic (Claude)
```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=anthropic
SUMMARIZATION_API_KEY=sk-ant-...
SUMMARIZATION_API_MODEL=claude-3-haiku-20240307  # or claude-3-opus, claude-3-sonnet
```

**Get API Key:** https://console.anthropic.com/

#### Together AI
```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=together
SUMMARIZATION_API_KEY=your-together-key
SUMMARIZATION_API_MODEL=meta-llama/Llama-2-7b-chat-hf  # or other models
```

**Get API Key:** https://api.together.xyz/

#### Groq
```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=groq
SUMMARIZATION_API_KEY=gsk_...
SUMMARIZATION_API_MODEL=openai/gpt-oss-120b  # or llama-3.3-70b-versatile, mixtral-8x7b-32768
SUMMARIZATION_API_BASE_URL=https://api.groq.com/openai/v1
```

**Get API Key:** https://console.groq.com/

### Step 3: Custom Endpoints

If you're using a custom API endpoint (e.g., local proxy, Azure OpenAI):

```env
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=openai
SUMMARIZATION_API_KEY=your-key
SUMMARIZATION_API_MODEL=gpt-3.5-turbo
SUMMARIZATION_API_BASE_URL=https://your-custom-endpoint.com/v1
```

### Step 4: Verify Configuration

The pipeline will automatically:
1. Check if `USE_API_SUMMARIZATION=true`
2. Validate API key is present
3. Use API if configured, otherwise fall back to local model

## Example `.env` File

```env
# ... other configuration ...

# Use API for summarization (recommended for better quality)
USE_API_SUMMARIZATION=true
SUMMARIZATION_API_PROVIDER=openai
SUMMARIZATION_API_KEY=sk-proj-abc123xyz...
SUMMARIZATION_API_MODEL=gpt-3.5-turbo

# Keep local model as fallback
SUMMARIZATION_MODEL=facebook/bart-large-cnn
```

## Benefits of API-Based Summarization

✅ **Better Quality**: GPT-3.5/4 and Claude produce higher quality summaries  
✅ **No Local Resources**: No need to download/run large models  
✅ **Faster**: API calls are often faster than local inference  
✅ **Cost-Effective**: Pay per use, no GPU required  

## Cost Considerations

- **OpenAI GPT-3.5-turbo**: ~$0.0015 per 1K tokens (very affordable)
- **OpenAI GPT-4**: ~$0.03 per 1K tokens (higher quality, more expensive)
- **Claude Haiku**: ~$0.00025 per 1K tokens (very affordable)
- **Together AI**: Varies by model (often cheaper)

For a typical scientific paper (10-20 sections):
- GPT-3.5-turbo: ~$0.01-0.05 per paper
- Claude Haiku: ~$0.002-0.01 per paper

## Troubleshooting

### API Key Not Working
- Check key is correct (no extra spaces)
- Verify key has proper permissions
- Check API provider status page

### Rate Limits
- Add retry logic (already built-in)
- Consider using local model as fallback
- Upgrade API tier if needed

### Fallback Behavior
If API fails, the system automatically falls back to:
1. Local model (if available)
2. Simple truncation (last resort)

## Code Location

The API integration is in:
- **Configuration**: `config.py` (lines 27-33)
- **Implementation**: `pipeline/summarizer.py` (methods: `_summarize_openai`, `_summarize_anthropic`, `_summarize_together`)

You can extend support for other providers by adding new methods in `summarizer.py`.


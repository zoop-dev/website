
export function initWebMCP() {
  if (typeof document === 'undefined') return;

  
  const mcp = document.modelContext || navigator.modelContext;
  if (!mcp) {
    console.log('WebMCP not supported or enabled in this browser.');
    return;
  }

  console.log('WebMCP detected. Registering interactive portfolio tools...');

  
  try {
    mcp.registerTool({
      name: "boop_blob",
      description: "Poke or boop the interactive WebGL blob. Triggers a ripple and play sound.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      execute: async () => {
        if (typeof window !== 'undefined' && window.zoop?.boop) {
          window.zoop.boop();
          return "blob successfully booped!";
        }
        return "failed: window.zoop.boop not available";
      }
    });
  } catch (e) {
    console.warn('Failed to register tool: boop_blob', e);
  }

  
  try {
    mcp.registerTool({
      name: "trigger_chaos",
      description: "Triggers the secret 'chaos mode' on the portfolio website, causing screen shaking and graphic anomalies.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      execute: async () => {
        if (typeof window !== 'undefined' && window.zoop?.chaos) {
          window.zoop.chaos();
          return "chaos mode successfully triggered!";
        }
        return "failed: window.zoop.chaos not available";
      }
    });
  } catch (e) {
    console.warn('Failed to register tool: trigger_chaos', e);
  }

  
  try {
    mcp.registerTool({
      name: "barrel_roll",
      description: "Performs a full 360-degree rotation of the entire website screen.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      execute: async () => {
        if (typeof window !== 'undefined' && window.zoop?.roll) {
          window.zoop.roll();
          return "barrel roll successfully triggered!";
        }
        return "failed: window.zoop.roll not available";
      }
    });
  } catch (e) {
    console.warn('Failed to register tool: barrel_roll', e);
  }

  
  try {
    mcp.registerTool({
      name: "splash_fluid",
      description: "Triggers a random splash of liquid ink on the interactive GPU fluid simulation canvas.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      execute: async () => {
        if (typeof window !== 'undefined' && window.zoop?.ink) {
          window.zoop.ink();
          return "fluid splash successfully triggered!";
        }
        return "failed: window.zoop.ink not available";
      }
    });
  } catch (e) {
    console.warn('Failed to register tool: splash_fluid', e);
  }

  
  try {
    mcp.registerTool({
      name: "get_portfolio_info",
      description: "Retrieve dynamic JSON configuration of this portfolio, containing metadata, projects, socials, and stats.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      },
      execute: async () => {
        if (typeof window !== 'undefined' && window.zoop?.config) {
          return JSON.stringify(window.zoop.config);
        }
        try {
          const res = await fetch('/api/config');
          if (res.ok) {
            return await res.text();
          }
        } catch (_) {}
        return JSON.stringify({
          name: "zoop",
          skills: ["WebGL", "Three.js", "Shaders", "GLSL", "Motion design"]
        });
      }
    });
  } catch (e) {
    console.warn('Failed to register tool: get_portfolio_info', e);
  }
}

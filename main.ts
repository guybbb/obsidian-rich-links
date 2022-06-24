import { Notice, Plugin, Editor, MarkdownView } from "obsidian";

interface ObsidianRichLinksPluginSettings {
}

interface crestifyJSON {
  meta: {title?:string, description?:string},
  links: {
    rel: string;
    type: "text/html" | "image/jpeg" | "image/png" | "image";
    media?: { height: number; width: number };
    href: string;
  }[];
  rel: string[];
  html: string[];
}

const DEFAULT_SETTINGS: ObsidianRichLinksPluginSettings = {};

export default class ObsidianRichLinksPlugin extends Plugin {
  settings: ObsidianRichLinksPlugin;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();

    this.addRibbonIcon("link", "Rich Links", () => {
      let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView) {
        let editor = activeView.editor;
        this.urlToIframe(editor);
      }
    });

    this.addCommand({
      id: "create-rich-links",
      name: "Create Rich Links",
      editorCheckCallback: (checking: boolean, editor: Editor) => {
        if (!checking) {
          this.urlToIframe(editor);
        }
        return true;
      },
    });
  }

  onunload() {
    console.log("unloading plugin");
  }

  isUrl(text: string): boolean {
    const urlRegex = new RegExp(
      "^(http:\\/\\/www\\.|https:\\/\\/www\\.|http:\\/\\/|https:\\/\\/)?[a-z0-9]+([\\-.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$"
    );
    return urlRegex.test(text);
  }

  urlToIframe(editor: Editor): void {
    let selectedText = editor.somethingSelected()
      ? editor.getSelection()
      : false;

    if (selectedText && this.isUrl(selectedText)) {
      const url = selectedText;
      ajaxPromise({
        url: `http://iframely.server.crestify.com/iframely?url=${url}`,
      }).then((res:string) => {
        const data:crestifyJSON = JSON.parse(res);
        const imageLink = data.links.find( link => link.type.includes('image'))

        editor.replaceSelection(`
<div class="rich-link-card-container"><a class="rich-link-card" href="${url}" target="_blank">
	<div class="rich-link-image-container">
		<div class="rich-link-image" style="background-image: url('${imageLink.href}')">
	</div>
	</div>
	<div class="rich-link-card-text">
		<h1 class="rich-link-card-title">${(data.meta.title || "")
      .replace(/\s{3,}/g, " ")
      .trim()}</h1>
		<p class="rich-link-card-description">
		${(data.meta.description || "").replace(/\s{3,}/g, " ").trim()}
		</p>
		<p class="rich-link-href">
		${url}
		</p>
	</div>
</a></div>

`);
      });
    } else {
      new Notice("Select a URL to convert to rich link.");
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

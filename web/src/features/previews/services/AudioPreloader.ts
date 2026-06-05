export class AudioPreloader {
  private cache = new Map<string, HTMLAudioElement>();

  setWindow(urls: string[]) {
    const keep = new Set(urls);
    for (const [url, audio] of this.cache) {
      if (!keep.has(url)) {
        this.dispose(audio);
        this.cache.delete(url);
      }
    }
    for (const url of urls) {
      if (!this.cache.has(url)) {
        this.cache.set(url, this.create(url));
      }
    }
  }

  destroy() {
    for (const audio of this.cache.values()) {
      this.dispose(audio);
    }
    this.cache.clear();
  }

  private create(url: string): HTMLAudioElement {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    audio.load();
    return audio;
  }

  private dispose(audio: HTMLAudioElement): void {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
}

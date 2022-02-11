---
title: AMP
---

現代のWeb開発における残念な現実として、サイトの [AMP](https://amp.dev/ja/) バージョンを作成しなければならないときがある、というものがあります。SvelteKitでは [`amp`](/docs/configuration#amp) コンフィグオプションを設定することでこれを行うことができます。これには、以下の効果があります。

- ルーターを含むクライアントサイドJavaScriptが無効になります
- スタイルは `<style amp-custom>` に連結され、[AMP boilerplate](https://amp.dev/boilerplate/) がインジェクトされます
- 開発時には、リクエストは [AMP validator](https://validator.ampproject.org/) でチェックされるため、エラーがあれば早い段階で警告を受け取ることができます

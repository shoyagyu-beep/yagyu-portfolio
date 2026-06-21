# ヤギュウショウ アーティスト・ポートフォリオサイト
## Claude Code 実装ハンドオフ資料

これまでの検討(ページ構成・データモデル・技術構成・デザイン方向性)を1つに統合した、実装のための資料。

---

## 0. このサイトについて

写真作品、制作途中の思考、詩や文章、展示、出版、共同制作を一つの場所に蓄積するアーティストポートフォリオサイト。完成した作品を見せるだけでなく、作品が生まれるまでの思考や、制作の途中で見つかった言葉も含めて蓄積する。

- 商業撮影の依頼者は主な対象にしない
- 主な閲覧者:作品に関心を持った人、編集者、キュレーター、ギャラリーや展示施設の関係者、表現者、共同制作を検討する人(国内外)
- FOLK FOLK Inc.の商業案件とは別の、個人のアーティスト活動用サイト

---

## 1. ページ構成

4ページ構成。

- Home
- Projects(Project Detailをサブページとして含む)
- Notes
- About(Contactを含む)

### Home

- 作家名
- 短い言葉
- 主要Projectsへの導線
- 最新Note
- 進行中の活動
- 各ページへの遷移

### Projects

- 一覧情報:作品名・制作年または期間・代表画像・進行状況(表示するかは作品が揃うまで未確定)・短い説明
- 各作品はProject Detail(サブページ)へ遷移する

### Project Detail(作品ごとに3パターンから選択)

**パターンA:ステートメント先行型**
作品名 → 制作年/進行状況 → ステートメント → 写真 → 制作記録 → 関連Note → 展示・出版歴 → クレジット

**パターンB:写真先行型**
作品名 → 制作年/進行状況 → 写真 → ステートメント(短文) → 制作記録 → 関連Note → 展示・出版歴 → クレジット

**パターンC:進行形(対話・共同制作)型**
作品名 → 現在の状況 → 対話・制作記録(時系列) → 写真/絵画 → 現時点での問い → 共同制作者

制作過程(試行錯誤の記録)を含めるかどうかは作品ごとに判断する(`includeProcess`フラグで管理)。

### Notes

- 公開初日から設ける
- 種別(初回想定):Poem(詩)/ 制作日記・フィールドノート / デイリー(写真+短文)。固定enumにせず増やせる前提
- ProjectsとNotesは相互参照する。Note側を正本とし、Project Detail側はNoteへのリンクカードとして表示する(重複掲載を避ける)

### About

- 詳しい経歴とアーティストステートメントを掲載する
- 展示歴・出版歴の一覧をAboutに置く(Books/Exhibitionsはまだ独立させない)
- 商業活動(撮影・デザイン)への導線は、末尾に短く記載する
- Contactは独立ページにせず、About内に含める

### Books/Exhibitions(将来)

現時点では独立ページにしない。以下のいずれか早いタイミングで独立を検討する。

- 展示・出版が合計5〜6件を超えたとき
- 複数のProjectsにまたがる発表が発生したとき

---

## 2. データモデル

```ts
type ProjectStatus = "ongoing" | "completed" | "archive";
type ProjectPattern = "A" | "B" | "C";

interface Photo {
  url: string;
  caption?: string;
  order: number;
}

interface ProcessEntry {
  date?: string;
  text: string;
  photos?: Photo[];
}

interface ExhibitionOrPublication {
  title: string;
  type: "Exhibition" | "Book" | "Zine" | "Collaboration";
  date: string;
  venueOrPublisher?: string;
  summary?: string;
  externalLink?: string;
  relatedProjectIds?: string[];
}

interface Person {
  name: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  period?: string;
  status?: ProjectStatus;
  showStatus: boolean;
  pattern: ProjectPattern;
  coverImage?: Photo;
  summary: string;
  summaryEn?: string;
  statement: string;
  statementEn?: string;
  startingQuestion?: string;
  photos: Photo[];
  includeProcess: boolean;
  process?: ProcessEntry[];
  exhibitions?: ExhibitionOrPublication[];
  collaborators?: Person[];
  credits?: Person[];
}

interface Note {
  id: string;
  title?: string;
  body: string;
  date: string;
  type: string; // "Poem" | "DiaryEntry" | "FieldNote" | "Daily" など
  photo?: Photo;
  relatedProjectIds?: string[];
}

interface AboutPage {
  name: string;
  bioShort: string;
  bioShortEn?: string;
  bioLong: string;
  bioLongEn?: string;
  artistStatement: string;
  artistStatementEn?: string;
  focusAreas: string[];
  exhibitionHistory: ExhibitionOrPublication[];
  contactEmail: string;
  snsLinks?: { label: string; url: string }[];
  commercialNote?: { text: string; link?: string };
}

function getAllExhibitions(projects: Project[]): ExhibitionOrPublication[] {
  return projects.flatMap(p => p.exhibitions ?? []);
}
```

Notesは英語版を持たない。EN表示時もNotesの内容は日本語のまま表示する。

---

## 3. 技術スタック

- フレームワーク:Astro + Tailwind CSS
- ホスティング:Cloudflare Pages
- Projects用CMS:microCMS
- Notes用CMS:Notion(無料プラン)
- i18nルーティング:Astro組み込みi18n(日本語デフォルト、`/en/` プレフィックスで英語。英語版が無いページは日本語にフォールバック)

### Notion側のデータベース設計

| プロパティ | 型 | 用途 |
|---|---|---|
| Title | タイトル | 空でも可 |
| 本文 | ページ本体 | 自由記述 |
| 種別 | Select | Poem / DiaryEntry / FieldNote / Daily |
| 写真 | Files & media | カメラロールから直接添付 |
| 関連Project | Text | microCMS側のProject IDを記載 |
| 公開フラグ | Checkbox | チェックを入れたら次回反映時にサイトに載る |

### 定期リビルド設定(`.github/workflows/scheduled-rebuild.yml`)

```yaml
name: Scheduled Rebuild
on:
  schedule:
    - cron: "0 */6 * * *"  # 6時間ごと(必要に応じて調整)
  workflow_dispatch: {}

jobs:
  trigger-rebuild:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cloudflare Pages Deploy Hook
        run: curl -X POST "${{ secrets.CF_PAGES_DEPLOY_HOOK_URL }}"
```

Astroのビルド時、microCMSはREST APIでProjectsを取得し、Notionは公式SDK(`@notionhq/client`)でNotesデータベースをクエリ(公開フラグ=true のみ)、本文は`notion-to-md`等でMarkdown/HTMLに変換する。両者を関連Project IDで突き合わせ、相互リンクを構築する。

---

## 4. デザイン方向性

参照:https://systemofculture.com/(写真を主役にした、味の濃さを抑えたミニマルな方向性)

- **配色**:モノクロベース(白またはオフホワイト+黒)。装飾的なアクセントカラーは使わない
- **タイポグラフィ**:欧文はニュートラルなサンセリフ、和文はシンプルなゴシック体。見出しと本文のコントラストも控えめにする
- **レイアウト**:画像を主役にした余白の多い構成。ナビゲーションはテキストリンクのみ、装飾的なボタンやアイコンは避ける
- **動き**:フェード程度の最小限のアニメーションのみ。派手なホバーエフェクトは使わない
- **About内の展示歴・出版歴一覧**:「+」で開閉するような、静かで機能的なUIにする

---

## 5. 初回公開コンテンツ

### Projects(2件)

| 作品名 | パターン | 概要 |
|---|---|---|
| 『ごめんね』 | A | 妻との距離、謝ることのできない自分、置き去りにされた自分をめぐる写真作品。5枚以上の写真とステートメントあり |
| BUBBLES vol.1 | A | 死を終わりではなく「生」の一部として捉え直す思想的実験のZINE。写真・詩・物語で構成。takeshi nakataniを被写体としたポートレートと、彼の空想上の死についての物語。5枚以上の写真とステートメントあり。クレジットにtakeshi nakataniを被写体として記載する。vol.2以降が出た場合の構成(1つのProjectに蓄積するか、別Projectにするか)は未定 |

### 保留・後で追加予定

- `.path`(道を前提としない認識をめぐる作品)
- 伊勢の125社を巡るプロジェクト

### 保留・存続不明

- 抽象画家との共同プロジェクト(プロジェクト自体が継続するか不明なため、現時点では掲載しない)

---

## 6. 実装の進め方(推奨順序)

1. Astroプロジェクトの初期セットアップ(Tailwind、i18nルーティング)
2. データ取得レイヤーの実装(microCMSクライアント、Notionクライアント)
3. Home / Projects / Notes / Aboutの各ページテンプレート実装
4. Project Detailのパターン別テンプレート実装(A/B/C)
5. デザインシステムの実装(配色・タイポグラフィ・「+」開閉UIなど)
6. 初回コンテンツ(『ごめんね』『BUBBLES vol.1』)の投入
7. GitHub Actionsの定期リビルド設定
8. デプロイ・最終確認

---

## 7. 残っている確認事項

- Aboutページの英語化について、対象範囲の最終確認(現状は英語化する想定で進めている)
- 各Projectの制作年/期間、進行状況の確定
- 展示歴・出版歴の詳細(BUBBLES vol.1の発行日や形態など)
- 制作過程(試行錯誤の記録)を載せる場合の素材の有無

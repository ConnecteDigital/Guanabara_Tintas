# Análise técnica das referências, parte 2

Sites: **nfinitepaper.com**, **aether1.ai**, **alche.studio**, **seasats.com**, **cornrevolution.resn.global**, **magic.estudionk.com**.

Método: download do HTML e dos bundles JS de produção, leitura do código (bibliotecas, shaders, padrões de scroll) e teste num Chromium headless (Playwright) para medir peso, número de requisições e travadas. O navegador de teste não tem placa de vídeo, então os tempos absolutos são piores que num PC real. A comparação entre os sites continua válida.

> **Limitação:** a rede deste ambiente só libera os domínios dos próprios sites. Por isso não consegui baixar o JavaScript do **aether1.ai** (fica em `cdn.prod.website-files.com` e `aether-two-kappa.vercel.app`) nem do **cornrevolution** (fica em `d1hl9u9k5hiqxp.cloudfront.net`). Desses dois só analisei o HTML.

---

## Resumo rápido

| Site | Framework | Animação / scroll | 3D / WebGL | Peso medido* | Ponto fraco |
|---|---|---|---|---|---|
| nfinitepaper | Next.js (Turbopack) + Tailwind v4 + Sanity | GSAP + ScrollTrigger (`scrub`) + Lenis, via `useGSAP` | Quase nada (canvas de partículas). Vídeos Mux | **1,6 MB**, 49 req. | Muito leve. Peca só pelo excesso de tarefas JS no scroll |
| aether1 | Webflow + jQuery | Lenis + Taxi.js (transição de página) + `app.js` próprio | Canvas WebGL próprio (`data-gl-canvas`) | — (bloqueado) | Dois JS externos, um deles num deploy Vercel avulso |
| alche.studio | Astro + Swup | GSAP 3.13 + ScrollTrigger + SplitText + Lenis | Three.js r177, 28 `ShaderMaterial`, 11 passes de pós-processamento, fluido | **3,7 MB**, 42 req. | 1 bundle de 1,8 MB, cena .glb + trilha de áudio de 1 MB antes de liberar a página |
| seasats | Next.js (App Router) + Payload CMS | GSAP + ScrollTrigger (`scrub`, 20×) + Lenis | React Three Fiber + Three.js, Draco/KTX2/Meshopt | **3,8 MB**, **619 req.** | ~2,8 MB de JS (antes da compressão), 26 vídeos e 5 canvas na mesma página |
| cornrevolution | Engine própria da Resn | Scroll virtual (`data-ui="scrollProxy"`) | WebGL em tela cheia | — (bloqueado) | Site de 2019. Tudo depende de um loader único |
| magic (Estudio NK) | Nuxt 2 (Vue) | Rolagem capturada no `wheel` + tween.js em modo MANUAL | Three.js + camera-controls + EffectComposer (bokeh, bloom, SMAA, ruído) | **8,6 MB**, 40 req. | **Publicado em build de desenvolvimento** (2,1 MB de JS sem minificar). Pós-processamento pesado |

\* Peso transferido no primeiro carregamento, medido no teste.

---

## 1. nfinitepaper.com: "o leve que funciona"
- Tudo em **DOM/CSS**: texto, SVG, imagens e vídeo. Quase não usa WebGL.
- Cada seção tem uma timeline GSAP ligada ao scroll:
  ```js
  gsap.timeline({ scrollTrigger: { trigger, start: "top 100%", end: "bottom 0%", scrub: 0.5 } })
      .fromTo(".impact-arrows", { rotate: 0 }, { rotate: 270, ease: "none" })
  ```
  O `scrub: 0.5` faz a animação "seguir" o scroll com meio segundo de suavização.
- Barra de progresso (`scaleX` 0→1), fundo com parallax (`y: -50% → 0%`), seções `sticky` e máscaras CSS (`mask-image`) para revelar conteúdo.
- Vídeos (Mux, em `low`/`medium`/`high.mp4`) **só tocam quando entram na tela** (IntersectionObserver) e voltam a 0 quando saem.
- **Lição**: boa parte do efeito "as coisas vão mudando enquanto eu rolo" sai barato com GSAP + ScrollTrigger + CSS. Não precisa de 3D em tudo.

## 2. aether1.ai
- Feito no **Webflow**, com um `app.js` próprio por cima. Os módulos aparecem pelos atributos `data-module`: `loader`, `Aether`, `Cursor`, `shapes`, `progress`, `tags`, `menu`.
- Scroll suave com **Lenis** (`data-lenis-prevent`) e transição entre páginas com **Taxi.js** (`data-taxi`, de unseen.co).
- Usa um `<canvas data-gl-canvas>`, ou seja, WebGL próprio por trás do conteúdo.
- O HTML tem dezenas de `gl__projected-point--projection-*` (`chip`, `mic`, `touch-pad`, `emission-core`…). São **etiquetas HTML presas a pontos do modelo 3D**: a posição 3D de cada peça é projetada na tela a cada frame e o rótulo segue por cima. É a técnica de "vista explodida" de produto. Para nós: a lata pode se desmontar no scroll (tampa, rótulo, tinta, alça) com etiquetas como "rendimento", "secagem", "acabamento".
- **Lição**: dá para separar o site em "módulos" ligados por atributos HTML. Isso facilita trocar o conteúdo sem mexer na animação.

## 3. alche.studio: "o mais bonito, e o mais pesado"
- **Astro** (gera HTML estático) + **Swup** (transições entre páginas sem recarregar).
- **GSAP 3.13** com ScrollTrigger, SplitText (texto que entra letra a letra) e Lenis.
- **Three.js r177**: 28 shaders próprios e 11 passes de pós-processamento. Os uniforms já dizem como funciona: `uScroll`, `uScrollVelocity`, `uScrollPage`, `uScrollPageLerp`, `uProgress`, `uNoise`. Ou seja, **o scroll vira um número que entra direto no shader**.
- Também roda uma simulação de fluido (`curl`, `pressureAttenuation`), como a Buttermax.
- Modelos `.glb` comprimidos com **Draco + Meshopt + KTX2**, que é o padrão certo.
- Animações de loading em **Lottie** (`/common/loading/*.json`) e som com **Howler** (`bgm.mp3`, 1 MB).
- **Por que trava/demora**: um único bundle de **1,8 MB** (473 KB comprimido), mais a cena 3D (685 KB) e a música (1 MB), e o site **espera tudo carregar** antes de liberar. No teste ficou preso no loader. Tarefas longas de até 1,5 s.

## 4. seasats.com: "3D de produto com scroll"
- **Next.js App Router** + **React Three Fiber** (Three.js em React) + Payload CMS.
- O scroll comanda o 3D por este padrão:
  ```js
  gsap.timeline({ scrollTrigger: { trigger, start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: e => { progress.current = e.progress } } })
  ```
  e dentro do `useFrame` o barco/câmera lê `progress.current`. **O React não renderiza de novo a cada scroll**: o valor fica num `ref`. Esse é o jeito certo de ligar o scroll a um objeto 3D sem travar.
- Troca de tema (claro/escuro) por seção com `onEnter`/`onLeaveBack`.
- Modelos comprimidos (Draco/KTX2/Meshopt, decoders em `.wasm`), imagens em **AVIF/WebP** com `next/image` e **47 vídeos MP4** de "hotspots" do produto.
- Respeita `prefers-reduced-motion`, o único do grupo que faz isso.
- **Ponto fraco**: muito JavaScript (chunks de 520 KB, 380 KB e 330 KB) e dezenas de vídeos. No teste: **619 requisições**, 26 `<video>` e **5 canvas WebGL** na mesma página (cada canvas é um contexto de GPU separado). Ficou no loader mesmo depois de rolar. Cada vídeo que começa a tocar pode dar um engasgo.

## 5. cornrevolution.resn.global (Resn, 2019)
- HTML mínimo: `<div data-ui="scrollProxy">` + `<div data-ui="root">`, e um `loader.[hash].js` que carrega o resto.
- O `scrollProxy` é uma div alta só para gerar a barra de rolagem. A página de verdade é desenhada numa cena em tela cheia que lê esse scroll: o **"scroll virtual"**.
- Detecta navegador sem suporte e mostra uma página alternativa (`#unsupported`).
- **Lição**: o modelo "uma cena contínua, o scroll só move a câmera" dá a sensação de filme, mas tudo depende de um loader inicial grande.

## 6. magic.estudionk.com: "a garrafa 3D" (o mais próximo da nossa lata)
- **Nuxt 2 (Vue)** + **Three.js** + **camera-controls** + **tween.js**.
- O código veio **sem minificar** (build de desenvolvimento), o que permitiu ler a estrutura: `wgl.js`, `mod.animations.js`, `mod._interactive.js`, `mod.mats.js`, `mod.postprocessing.js`, `mod.sound.js`.
- Como o scroll funciona: o site **captura o `wheel`** (e até detecta trackpad vs. mouse) e avança uma timeline `TWEEN` em modo **MANUAL**, ou seja, o scroll vira o "tempo" da animação. A câmera interpola entre pontos (`lerpVectors(prev_target, next_target, offset)`).
- A garrafa 3D muda de material (cor, `roughness`, `metalness`) com tween e reage ao arrasto do mouse (`bottleDrag`).
- **Transições com vídeo de deslocamento**: `b2w.mp4` / `w2b.mp4` (preto→branco) usados como **máscara animada** num shader. É um truque barato para transições orgânicas, e serviria para tinta escorrendo.
- Pós-processamento: ruído + SMAA + bloom + **bokeh** (profundidade de campo).
- **Por que trava**: no teste, **8,6 MB** baixados antes de começar:
  - 4,4 MB são os dois vídeos de máscara (`b2w.mp4` 2,0 MB + `w2b.mp4` 2,3 MB);
  - o modelo da garrafa em **FBX sem compressão** (0,9 MB; em `.glb` + Draco ficaria uma fração disso);
  - céu em PNG de 640 KB;
  - 2,1 MB de JS sem minificar;
  - bokeh + bloom em tela cheia (muito caro na GPU).

  Ainda exige um clique ("Click anywhere to start") por causa do áudio. Tarefa JS mais longa no teste: **2,4 s** (a tela congela).

---

## 7. Por que esses sites demoram ou travam, e como vamos evitar

| Problema visto | Onde | Como faremos diferente |
|---|---|---|
| Bundle JS gigante antes de mostrar qualquer coisa | alche, magic, seasats | Separar o código: HTML/CSS e texto aparecem na hora. O 3D carrega depois, em `import()` dinâmico |
| Loader que espera **todos** os assets | alche, cornrevolution | A **animação da lata é o loader**: começa com o mínimo (lata + 1 shader) e o resto baixa em segundo plano |
| Build de desenvolvimento em produção | magic | Build de produção com minificação + compressão Brotli |
| Pós-processamento pesado (bokeh, bloom, vários passes) | magic, alche | No máximo 1 passe final barato. Bloom só no desktop |
| Texturas PNG/JPG enormes | magic | KTX2/Basis para texturas 3D, AVIF/WebP para imagens |
| Muitos vídeos MP4 | seasats, magic | Animação em shader/sequência de frames. Vídeo só sob demanda |
| Re-render do React a cada scroll | (risco em R3F) | Scroll em `ref`/uniform, nunca em `useState` |
| Áudio de 1 MB no carregamento | alche | Som opcional, carregado só quando o usuário ativa |
| Sem modo de movimento reduzido | quase todos | `prefers-reduced-motion` e versão leve no celular fraco |

**Metas para o site da Guanabara Tintas**
- Primeira tela visível em **< 1,5 s** no 4G
- **< 200 KB** de JS comprimido para a primeira tela
- **60 fps** no scroll
- Resolução do canvas limitada (`devicePixelRatio` máximo de 1,5–2)
- Pausar o render quando a aba ou a seção sai da tela

---

## 8. Stack proposta (juntando o melhor de cada um)
- **Astro** (como a alche: HTML estático e rápido, ótimo para SEO de loja física) **ou** Vite puro. Next.js só se precisarmos de muita coisa dinâmica.
- **GSAP + ScrollTrigger + SplitText** (padrão de todos os sites; hoje 100% gratuito).
- **Lenis** para o scroll suave (usado em 5 dos 8 sites analisados).
- **Three.js** para a lata 3D (`.glb` com Draco/Meshopt + texturas KTX2).
- **Shader de tinta**: simulação de fluido (estilo Buttermax/alche) no desktop e máscara de ruído / vídeo de deslocamento (estilo Pear/magic) como versão leve.
- O scroll vira um uniform `uProgress` (padrão alche/seasats), não estado do React.

---

## 9. Skills e repositórios no GitHub que podemos usar

**Skills para o Claude Code (instaláveis):**
- **greensock/gsap-skills**: skills oficiais da GreenSock (GSAP core, timeline, ScrollTrigger, plugins, React, performance). Instalação: `/plugin marketplace add greensock/gsap-skills`.
- **cloudai-x/threejs-skills**: Three.js por módulos (fundamentos, materiais, shaders, loaders, pós-processamento, interação).
- **OpenAEC-Foundation/Three.js-Claude-Skill-Package**: 24 skills de Three.js r160+.
- **freshtechbro/claudedesignskills**: marketplace com plugins de 3D e animação web.

> Esta sessão já tem skills equivalentes carregadas: `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-performance`, `gsap-react`, `threejs-*` (fundamentals, shaders, loaders, postprocessing, performance, R3F…), `scroll-cinematic`, `motion-web` e `awwwards`. Instalar as oficiais da GreenSock ainda vale para ter a versão mais atual.

**Bibliotecas/repos de código:**
- `PavelDoGreat/WebGL-Fluid-Simulation` (MIT): a simulação de fluido base, a mesma família de shaders da Buttermax.
- `darkroomengineering/lenis`: scroll suave.
- `greensock/GSAP`: animação + ScrollTrigger.
- `mrdoob/three.js` / `pmndrs/react-three-fiber` / `pmndrs/drei`: 3D.
- `donmccurdy/glTF-Transform`: comprime o modelo da lata (Draco/Meshopt/KTX2) por linha de comando.
- `swup/swup` ou `unseen-co/taxi`: transições entre páginas.

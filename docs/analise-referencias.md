# Análise técnica das referências — Guanabara Tintas

Sites analisados: **pear.no** e **buttermax.net**.
Método: download do HTML, JS, CSS e shaders de produção de cada site, leitura do código e navegação com Chromium headless (Playwright) para capturar telas durante o scroll.

---

## 1. pear.no

### Stack
| Camada | O que usam |
|---|---|
| Build | Vite (`/assets/index-[hash].js`, um bundle só) |
| UI | React 19 (só a casca: textos, botões, menu) |
| Animação | **Motor próprio em JavaScript puro**, sem GSAP e sem Three.js |
| Gráficos | **WebGL 1 cru** (`canvas.getContext('webgl')`) com um fragment shader único de ~50 KB |
| Scroll suave | Feito à mão: intercepta `wheel`, guarda `target` e faz `current += (target - current) * 0.085` a cada frame, depois `scrollTo()` |

### Como as animações de scroll funcionam
1. **Palco gigante com conteúdo fixo**: `.stage { height: 5350vh }` (7300vh no mobile). Dentro dele fica um `<canvas class="gl">` fixo na tela. A altura do palco é a "trilha" do scroll; o canvas não se move.
2. **Progresso de 0 a 1**: a cada `requestAnimationFrame` o código calcula `scrollY / (scrollHeight - innerHeight)` e divide em trechos. Cada trecho é uma cena.
3. **Sequências de imagens em vez de vídeo**: os "filmes" são pastas de frames `.webp` (`/films/tree/f_001.webp` … 121 frames, `renaissance` com 362 frames, versão `/768/` menor para o celular). O scroll escolhe o frame, que é enviado como textura para o WebGL. Os frames vizinhos são pré-decodificados com `img.decode()` para não travar. Isso permite rolar para frente e para trás sem engasgar, o que um `<video>` não faz bem.
4. **Transições no shader**: o shader recebe uniforms como `uT` (progresso), `uBurn`, `uSplit`, `uZoom`, `uPan`, `uSeam` e mistura duas imagens (`mix(A, B, mascara)`). As máscaras são geradas por ruído (fbm):
   - *queima*: uma frente de ruído avança com borda carbonizada e brilho de brasa (`uBurnChr`: char, glow, heat);
   - *meio-tom*: pontos que crescem (`uDot`);
   - *warp por ruído* (`uMode == 3`): as duas imagens se distorcem pelo mesmo campo de ruído, e a borda nunca é uma linha reta. **É a técnica mais parecida com tinta escorrendo.**
5. **Detalhes**: cursor com rastro em canvas 2D, linhas-guia desenhadas em canvas e parâmetros de debug na URL (`?hud`, `?nogl`, `?noscrub`).

> **Lição**: dá para fazer um "filme interativo" sem vídeo MP4. Basta uma sequência de frames ou uma cena desenhada no WebGL, com o scroll controlando o tempo e a transição feita no shader por máscara de ruído.

---

## 2. buttermax.net

### Stack
| Camada | O que usam |
|---|---|
| Framework | Next.js (Pages Router) + React |
| Motor 3D | **Hydra**, o engine proprietário do estúdio **Active Theory** (`UIL_ID: "at-buttermax-pf"`), carregado à parte em `assets/js/app.[cache].js` (~1,1 MB) |
| Shaders | Pacote `assets/shaders/compiled.vs` com ~110 shaders GLSL |
| Scroll suave | **Lenis 1.0.29** (`smoothWheel`, `lerp`) |
| Timeline | **GSAP** + **ScrollTrigger** (na parte React/DOM) |
| Outros | **Lottie** (ícones/animações vetoriais, renderizados até como textura WebGL), `SplitText`, `zustand` |
| Pós-processamento | Unreal Bloom, RGB shift, tonemapping Uncharted2, FXAA |

### Como as animações funcionam
1. **Simulação de fluido real (Navier-Stokes na GPU)**, o mesmo algoritmo do *WebGL Fluid Simulation* de Pavel Dobryakov. Os shaders são: `splatShader` (injeta tinta/força onde o mouse passa), `advectionShader` (o fluido carrega a cor), `curlShader` + `vorticityShader` (redemoinhos), `divergenceShader` + `pressureShader` + `gradientSubtractShader` (mantém o fluido incompressível) e `displayShader`. Cada passo roda em texturas ping-pong (FBO).
2. **Fluido como máscara** (`mousefluid.fs`): a velocidade do fluido distorce a UV das outras cenas. O mouse "mexe" a imagem como se ela fosse líquida.
3. **Transição entre cenas no scroll** (`ScrollSceneTransition.fs`): renderiza a cena atual (`tFrom`) e a próxima (`tTo`) em texturas e mistura as duas com `uTransition`, mais pontos, círculo expandindo, distorção CRT, RGB shift e uma textura de desenho (`tDraw`).
4. **Velocidade do scroll vira efeito**: o `ButtermaxVFX.fs` recebe `uVelocity` (velocidade do Lenis) e aplica zoom, warp ondulado em volta do mouse e separação RGB. Quanto mais rápido se rola, mais a tela "estica".
5. **Texto em WebGL**: as fontes são MSDF (`GLText`, `MSDFTextureShader`) para o texto deformar junto com os efeitos.

> **Lição**: o visual "líquido/manteiga" vem de uma simulação de fluido na GPU usada como camada de distorção e de máscara, mais transições de cena em shader comandadas pelo scroll (Lenis → progresso → uniform).

---

## 3. O que aproveitar no site da Guanabara Tintas

### Stack recomendada
- **Vite** (ou Next.js, se precisarmos de CMS/SEO pesado)
- **Three.js** para a lata 3D e as cenas, ou **OGL** se quisermos algo mais leve
- **GSAP + ScrollTrigger** para as timelines presas ao scroll (hoje o GSAP é gratuito, inclusive os plugins)
- **Lenis** para o scroll suave (o mesmo da Buttermax)
- **Simulação de fluido em WebGL** (base Dobryakov, licença MIT) para a tinta

### Intro: a lata que abre e joga tinta na tela (sem MP4)
1. **Lata 3D** (`.glb` modelado no Blender, com a tampa como peça separada) ocupando a tela, renderizada em Three.js.
2. **Timeline GSAP**: a lata desce do topo, tremida rápida, a tampa salta girando (rotação + física simples) e a lata tomba na direção da câmera.
3. **Tinta**: no momento do "jorro", injetamos vários *splats* coloridos na simulação de fluido, com força para baixo/para frente e a cor da marca. A tinta escorre e espirra de forma real e diferente a cada visita.
4. **Revelação da home**: a densidade da tinta vira máscara. Onde ela "molha", aparece a página inicial por baixo, misturada com uma borda de ruído como no `uMode 3` da Pear, para nunca ficar uma linha reta. No fim, a tinta escorre/seca e libera o scroll.
5. **Plano B em celular fraco**: em vez da simulação, uma máscara por ruído + metaballs no shader (mais barato), mantendo o mesmo visual.

### Scroll animando junto com a tinta
- Seções em **palco fixo** (`position: sticky` + altura grande, como o `.stage` da Pear). O progresso do ScrollTrigger alimenta uniforms (`uProgress`).
- **Transições entre seções feitas pela tinta**: uma onda de cor nova "pinta por cima" da seção anterior (rolo de pintura, pincelada, gota caindo e se espalhando).
- **Mouse como pincel**: o cursor deixa um rastro leve de tinta no fluido (o `splat` da Buttermax), com a cor da linha de produto que o usuário estiver vendo.
- **Velocidade do scroll**: tinta "estica"/escorre mais quando se rola rápido (`uVelocity`, como na Buttermax).
- **Catálogo de cores**: ao rolar, a tinta troca de cor e a lata gira mostrando o rótulo, com sequência de frames se quisermos renderização fotográfica (técnica da Pear).

### Cuidados
- Respeitar `prefers-reduced-motion` com uma versão estática.
- Pré-carregar assets durante a animação da lata; ela funciona como loader.
- Texto importante (endereço, horário, WhatsApp, produtos) em HTML de verdade por SEO e acessibilidade, com o WebGL só como camada visual.
- Limitar a resolução do fluido no mobile (ex.: 128px de simulação, 512px de tinta).

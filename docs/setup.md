# Setup: o que instalar para começar o projeto

## 1. Skills para o Claude Code

Rodar no terminal, **dentro da pasta do projeto**. Isso grava as skills em `.claude/skills/`.

```bash
# GSAP oficial (core, timeline, ScrollTrigger, plugins, React, performance)
npx skills add https://github.com/greensock/gsap-skills

# Three.js (fundamentos, materiais, shaders, loaders, animação, pós-processamento, interação)
npx -y skills add cloudai-x/threejs-skills --agent claude-code
```

Alternativa para o GSAP, de dentro do Claude Code:
```
/plugin marketplace add greensock/gsap-skills
```
Depois é só abrir `/plugin` e instalar a partir desse marketplace.

| Skill | Link |
|---|---|
| GSAP (oficial GreenSock) | https://github.com/greensock/gsap-skills |
| Three.js (cloudai-x) | https://github.com/cloudai-x/threejs-skills |
| Three.js (OpenAEC, 24 skills, r160+), opcional | https://github.com/OpenAEC-Foundation/Three.js-Claude-Skill-Package |

## 2. Projeto base

```bash
npm create astro@latest guanabara-tintas   # site estático e rápido, ótimo para SEO
cd guanabara-tintas
```

## 3. Bibliotecas de animação e 3D

```bash
npm install gsap lenis three
npm install -D vite-plugin-glsl @gltf-transform/cli
```

| Pacote | Para que serve | Link |
|---|---|---|
| `gsap` | Animações + ScrollTrigger + SplitText (tudo gratuito) | https://github.com/greensock/GSAP |
| `lenis` | Scroll suave | https://github.com/darkroomengineering/lenis |
| `three` | Lata 3D, cenas e shaders | https://github.com/mrdoob/three.js |
| `vite-plugin-glsl` | Importar arquivos `.glsl` (shaders da tinta) | https://github.com/UstymUkhman/vite-plugin-glsl |
| `@gltf-transform/cli` | Comprimir o modelo da lata (Draco/Meshopt/KTX2) | https://github.com/donmccurdy/glTF-Transform |

Comprimir o modelo da lata depois de exportar do Blender:
```bash
npx gltf-transform optimize lata.glb lata-otimizada.glb --compress meshopt --texture-compress ktx2
```

## 4. Código de referência (copiar e adaptar, não é pacote npm)

| Repositório | Uso no projeto | Link |
|---|---|---|
| WebGL Fluid Simulation (MIT) | Tinta líquida espirrando e escorrendo | https://github.com/PavelDoGreat/WebGL-Fluid-Simulation |

## 5. Opcionais

| Pacote | Quando usar | Link |
|---|---|---|
| `@react-three/fiber` + `@react-three/drei` | Só se o site for em React | https://github.com/pmndrs/react-three-fiber |
| `swup` | Transição animada entre páginas | https://github.com/swup/swup |
| `lottie-web` | Ícones animados | https://github.com/airbnb/lottie-web |

## 6. Ferramentas fora do código
- **Blender** (grátis), para modelar a lata com a tampa como peça separada: https://www.blender.org
- **Node.js 20+**: https://nodejs.org

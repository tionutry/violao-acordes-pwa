# Violão Acordes — DigitaHinos

Acompanhamento dos 480 hinos no violão (acordes) com a melodia do soprano ao fundo.
PWA estático: publique a pasta no GitHub Pages (ou qualquer hospedagem) e instale no celular.

## O que mudou em relação ao Violão Fingerstyle
- Removidos: pauta (VexFlow), tablatura e opções Fingerstyle.
- Folha 16:9 só com **letra + diagramas de acordes** alinhados à sílaba onde o acorde começa.
- **Melodia (soprano) ao fundo**: Violino, Flauta ou Violão (escolha do usuário, volume ajustável).
- **Acompanhamento**: Batida ou Dedilhado, cada um em 3 versões: **Fácil**, **Difícil** e **Misto**
  (o Misto alterna compasso a compasso a versão fácil e a difícil; o último compasso é um acorde final).

## Batidas e dedilhados
**Batida** (↓ palhetada para baixo, ↑ para cima). Cada troca de acorde começa sempre com ↓.

Compassos simples (2/2, 2/4, 3/4, 4/4, 3/2) — a batida acompanha o ritmo da melodia, nota por nota:
- **Difícil:** cada nota é subdividida em movimentos de semicolcheia ↓↑↓↑… (começando em ↓).
  Ex.: hino 1 → Cris ↓↑↓↑ · to ↓↑ · meu ↓↑ · Mes ↓↑↓↑ · tre ↓↑↓↑
- **Fácil:** nota curta (colcheia) ↓↑; nota maior um ↓ por tempo. Ex.: Cris ↓ · to ↓↑ · meu ↓↑ · Mes ↓ · tre ↓
- **Misto:** como o fácil, mas a última nota de cada compasso é subdividida como no difícil.

Compassos compostos (6/8, 9/8, 12/8, 6/4, 9/4) — cada tempo é um grupo de 3 pulsos:
- **Fácil:** ↓ em cada pulso (1↓ 2↓ 3↓ 4↓ 5↓ 6↓)
- **Difícil:** por grupo ↓↑ ↓↑ ↓ (4 semicolcheias + 1 colcheia)
- **Misto:** ↓ em cada pulso e ↓↑ no fim de cada grupo (1↓ 2↓ 3↓↑ 4↓ 5↓ 6↓↑)

Em andamento rápido (acima de ♩=88) o movimento passa de semicolcheia para colcheia.

**Dedilhado** (p/q polegar no baixo e baixo alternado · i 3ª corda · m 2ª · a 1ª). Em toda troca de acorde
o primeiro toque é o baixo (p). Padrões por compasso em `chords.js` → `PAT.dedilhado`:

| Compasso | Fácil | Difícil |
|---|---|---|
| 4/4 e 2/2 | p i m i | p i m a q i m i |
| 2/4 | p i m i | p i m a q i m i (semicolcheias) |
| 3/4 e 3/2 | p i m | p i m a m i |
| 6/8 e 6/4 | p i m p i m | p i m q m a |
| 9/8 e 9/4 | p i m q i m p i m | p i m a m i q i m |
| 12/8 | 4 grupos p i m / q i m | p i m a m i q i m a m i |

O **Misto** do dedilhado alterna compasso a compasso o fácil e o difícil. O último compasso do hino
é sempre um acorde final (rolado).

## Acordes
`chords.js` gera as formas no braço (todas as cordas soando, dedos e pestana), escolhe o tom mais
confortável (ou mantém o original com capotraste) e usa baixo invertido (C/E) nos níveis Difícil e Misto.

## Arquivos
index.html · app.css · app.js · chords.js (acordes/batidas/dedilhados) · audio.js (violão, violino, flauta, player)
· sheet.js (letra + diagramas) · guitar.js (violão animado) · hinos.json · sw.js · manifest.webmanifest
Ao publicar nova versão, altere `VERSION` em `sw.js`.

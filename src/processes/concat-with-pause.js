const { exec } = require('child_process');
const { existsSync } = require('fs');
const { rm } = require('fs/promises');

const reply = (id) => (err) => {
  if (err) process.exit(1);

  process.send({ id });
};

const buildConcatSource = (inputSourceTimes, tag, silenceTag) =>
  Array(inputSourceTimes)
    .fill(tag)
    .reduce(
      (acc, cur, inx) =>
        acc + `${inx === 0 ? '' : ` [${silenceTag}${inx - 1}]`} ${cur} `,
      '',
    );

const buildSilence = (inputSourceTimes, repeatDelay, silenceTag) =>
  inputSourceTimes > 1
    ? Array(inputSourceTimes - 1)
        .fill(null)
        .map(
          (_, inx) =>
            `, aevalsrc=exprs=0:d=${repeatDelay / 1000}[${silenceTag}${inx}]`,
        )
        .join('')
    : '';

const concat = async ({
  inputSource1,
  inputSource2,
  outputPath,
  id,
  pauseMs,
  inputSource1Times,
  inputSource2Times,
  repeatSourceDelay,
  repeatTargetDelay,
}) => {
  if (existsSync(outputPath)) await rm(outputPath);

  const silenceSourceTag = buildSilence(
    inputSource1Times,
    repeatSourceDelay,
    'silenceSource',
  );

  const silenceTargetTag = buildSilence(
    inputSource2Times,
    repeatTargetDelay,
    'silenceTarget',
  );

  const concatSource = buildConcatSource(
    inputSource1Times,
    '[0:a]',
    'silenceSource',
  );

  const concatTarget = buildConcatSource(
    inputSource2Times,
    '[1:a]',
    'silenceTarget',
  );

  const concatCount = 2 * (inputSource1Times + inputSource2Times) - 1;

  exec(
    `ffmpeg -i ${inputSource1}  -i ${inputSource2} -filter_complex "aevalsrc=exprs=0:d=${
      pauseMs / 1000
    }[silence]${silenceSourceTag}${silenceTargetTag}, ${concatSource} [silence] ${concatTarget} concat=n=${concatCount}:v=0:a=1 [outa]" -map "[outa]" ${outputPath}`,
    reply(id),
  );
};

process.on('message', (message) => concat(message));

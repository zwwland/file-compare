var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/dtypes.js
var require_dtypes = __commonJS({
  "src/dtypes.js"(exports, module) {
    var directions = Object.freeze({
      NONE: 0,
      DIAGONAL: 1,
      LEFT: 2,
      TOP: 3
    });
    var TracedScore = (score, direction = directions.NONE) => {
      if (Object.values(directions).includes(direction)) {
        return { score, direction };
      }
      throw TypeError("Invalid direction value for TracedScore");
    };
    module.exports = {
      TracedScore,
      directions
    };
  }
});

// src/utils.js
var require_utils = __commonJS({
  "src/utils.js"(exports, module) {
    var { TracedScore } = require_dtypes();
    var pipe = (...fns) => fns.reduce((prev, curr) => (x) => curr(prev(x)), (x) => x);
    var reverse = (x) => -x;
    var nanException = () => {
      throw TypeError("Non number input to decreaseAndRectify().");
    };
    var throwIfNotNumber = (x) => Number.isNaN(Number(x)) ? nanException() : x;
    var scoreReducer = (max, score) => {
      if (Number.isInteger(score.score)) {
        return score.score > max.score ? score : max;
      }
      throw TypeError(`Score object as an invalid score property: ${score.score}.`);
    };
    var reduceTracedScores = (scores, defaultScore) => scores.reduce(scoreReducer, TracedScore(defaultScore));
    module.exports = {
      reverse: pipe(throwIfNotNumber, reverse),
      reduceTracedScores
    };
  }
});

// src/matrix.utils.js
var require_matrix_utils = __commonJS({
  "src/matrix.utils.js"(exports, module) {
    var { directions } = require_dtypes();
    var initNWScoringMatrix = ({ width, heigth }) => {
      const matrix = [];
      for (let row = 0; row < heigth; row += 1) {
        if (row === 0) {
          matrix[row] = Array(width).fill().map((_, i) => -i || 0);
        } else {
          matrix[row] = Array(width).fill(0);
          matrix[row][0] = -row;
        }
      }
      return matrix;
    };
    var initNWTracebacMatrix = ({ width, heigth }) => {
      const matrix = [];
      for (let row = 0; row < heigth; row += 1) {
        if (row === 0) {
          matrix[row] = Array(width).fill(directions.LEFT);
        } else {
          matrix[row] = Array(width).fill(directions.NONE);
          matrix[row][0] = directions.TOP;
        }
        matrix[0][0] = directions.NONE;
      }
      return matrix;
    };
    var createMatrix = ({ width, heigth, fill = 0 }) => Array(heigth).fill(fill).map(() => Array(width).fill(fill));
    var extractRow = ({ matrix, row, col }) => matrix[row].slice(0, col + 1);
    var extractColumn = ({ matrix, row, col }) => matrix.slice(0, row + 1).map((_row) => _row.slice(col, col + 1)).reduce((prev, curr) => [...prev, ...curr], []);
    module.exports = {
      createMatrix,
      extractColumn,
      extractRow,
      initNWScoringMatrix,
      initNWTracebacMatrix
    };
  }
});

// src/nw.algorithm.js
var require_nw_algorithm = __commonJS({
  "src/nw.algorithm.js"(exports, module) {
    var { initNWScoringMatrix, initNWTracebacMatrix } = require_matrix_utils();
    var { reduceTracedScores } = require_utils();
    var { TracedScore, directions } = require_dtypes();
    function needlemanWunsch({ sequence1, sequence2, gapScoreFunction, similarityScoreFunction }) {
      const heigth = sequence1.length + 1;
      const width = sequence2.length + 1;
      const scoringMatrix = initNWScoringMatrix({ width, heigth });
      const tracebackMatrix = initNWTracebacMatrix({ width, heigth });
      let lastScore = 0;
      let lastCoordinates = [0, 0];
      for (let row = 1; row < heigth; row += 1) {
        for (let col = 1; col < width; col += 1) {
          const similarityScore = similarityScoreFunction(sequence1[row - 1], sequence2[col - 1]);
          const scores = [
            TracedScore(scoringMatrix[row - 1][col] + gapScoreFunction(), directions.TOP),
            TracedScore(scoringMatrix[row][col - 1] + gapScoreFunction(), directions.LEFT),
            TracedScore(scoringMatrix[row - 1][col - 1] + similarityScore, directions.DIAGONAL)
          ];
          const { score: cellScore, direction } = reduceTracedScores(scores, -Infinity);
          scoringMatrix[row][col] = cellScore;
          tracebackMatrix[row][col] = direction;
          lastScore = cellScore;
          lastCoordinates = [row, col];
        }
      }
      return {
        alignmentScore: lastScore,
        scoringMatrix,
        tracebackMatrix,
        tracebackStart: lastCoordinates
      };
    }
    module.exports = needlemanWunsch;
  }
});

// src/sw.algorithm.js
var require_sw_algorithm = __commonJS({
  "src/sw.algorithm.js"(exports, module) {
    var { createMatrix, extractColumn, extractRow } = require_matrix_utils();
    var { reduceTracedScores } = require_utils();
    var { TracedScore, directions } = require_dtypes();
    function computeGapLength(sequence) {
      let max = -1;
      let gapLength = 0;
      for (let cursor = 1; cursor < sequence.length; cursor += 1) {
        if (sequence[cursor] > max) {
          max = sequence[cursor];
          gapLength = cursor;
        }
      }
      return { max, gapLength };
    }
    function computeScores({ scoringMatrix, row, col, gapScoreFunction, similarityScore }) {
      const leftSequence = extractRow({ matrix: scoringMatrix, row, col });
      const topSequence = extractColumn({ matrix: scoringMatrix, row, col });
      const { max: leftMax, gapLength: leftGapLength } = computeGapLength(leftSequence.reverse());
      const { max: topMax, gapLength: topGapLength } = computeGapLength(topSequence.reverse());
      return [
        TracedScore(topMax + gapScoreFunction(topGapLength), directions.TOP),
        TracedScore(leftMax + gapScoreFunction(leftGapLength), directions.LEFT),
        TracedScore(scoringMatrix[row - 1][col - 1] + similarityScore, directions.DIAGONAL)
      ];
    }
    function smithWaterman({ sequence1, sequence2, gapScoreFunction, similarityScoreFunction }) {
      const heigth = sequence1.length + 1;
      const width = sequence2.length + 1;
      const scoringMatrix = createMatrix({ width, heigth });
      const tracebackMatrix = createMatrix({ width, heigth, fill: directions.NONE });
      let highestScore = 0;
      let highestScoreCoordinates = [0, 0];
      for (let row = 1; row < heigth; row += 1) {
        for (let col = 1; col < width; col += 1) {
          const similarityScore = similarityScoreFunction(sequence1[row - 1], sequence2[col - 1]);
          const scores = computeScores({
            scoringMatrix,
            row,
            col,
            gapScoreFunction,
            similarityScore
          });
          const { score: bestScore, direction } = reduceTracedScores(scores, 0);
          scoringMatrix[row][col] = bestScore;
          tracebackMatrix[row][col] = direction;
          if (bestScore >= highestScore) {
            highestScore = bestScore;
            highestScoreCoordinates = [row, col];
          }
        }
      }
      return {
        alignmentScore: highestScore,
        scoringMatrix,
        tracebackMatrix,
        tracebackStart: highestScoreCoordinates
      };
    }
    module.exports = smithWaterman;
  }
});

// src/traceback.utils.js
var require_traceback_utils = __commonJS({
  "src/traceback.utils.js"(exports, module) {
    var { directions } = require_dtypes();
    var alignmentUpdaters = (gapSymbol) => (direction) => {
      const updaters = {
        [directions.DIAGONAL]: ({ seq1, seq2, row, col }) => [seq1[row - 1], seq2[col - 1]],
        [directions.LEFT]: ({ seq2, col }) => [gapSymbol, seq2[col - 1]],
        [directions.TOP]: ({ seq1, row }) => [seq1[row - 1], gapSymbol]
      };
      return updaters[direction];
    };
    var coordinateUpdaters = (direction) => {
      const getters = {
        [directions.DIAGONAL]: ([row, col]) => [row - 1, col - 1],
        [directions.LEFT]: ([row, col]) => [row, col - 1],
        [directions.TOP]: ([row, col]) => [row - 1, col]
      };
      return getters[direction];
    };
    module.exports = {
      alignmentUpdaters,
      coordinateUpdaters
    };
  }
});

// src/traceback.js
var require_traceback = __commonJS({
  "src/traceback.js"(exports, module) {
    var { alignmentUpdaters, coordinateUpdaters } = require_traceback_utils();
    var { directions } = require_dtypes();
    function traceback({ sequence1, sequence2, tracebackMatrix, tracebackStart, gapSymbol }) {
      let [row, col] = tracebackStart;
      const aligned1 = [];
      const aligned2 = [];
      const coordinateWalk = [[row, col]];
      const updaters = alignmentUpdaters(gapSymbol);
      while (tracebackMatrix[row][col] !== directions.NONE) {
        const direction = tracebackMatrix[row][col];
        const alignmentUpdater = updaters(direction);
        const [char1, char2] = alignmentUpdater({ seq1: sequence1, seq2: sequence2, row, col });
        aligned1.unshift(char1);
        aligned2.unshift(char2);
        const coordinateUpdater = coordinateUpdaters(direction);
        [row, col] = coordinateUpdater([row, col]);
        coordinateWalk.push([row, col]);
      }
      return {
        alignedSequence1: aligned1.join(""),
        alignedSequence2: aligned2.join(""),
        coordinateWalk
      };
    }
    module.exports = traceback;
  }
});

// src/aligner.factory.js
var require_aligner_factory = __commonJS({
  "src/aligner.factory.js"(exports, module) {
    var { directions } = require_dtypes();
    var traceback = require_traceback();
    var AlignerFactory = ({
      algorithm,
      similarityScoreFunctionDefault,
      gapScoreFunctionDefault,
      gapSymbolDefault
    }) => ({
      similarityScoreFunction = similarityScoreFunctionDefault,
      gapScoreFunction = gapScoreFunctionDefault,
      gapSymbol = gapSymbolDefault
    } = {}) => ({
      similarityScoreFunction,
      gapScoreFunction,
      gapSymbol,
      directions,
      align(sequence1 = "", sequence2 = "") {
        const { alignmentScore, scoringMatrix, tracebackMatrix, tracebackStart } = algorithm({
          sequence1,
          sequence2,
          gapScoreFunction: this.gapScoreFunction,
          similarityScoreFunction: this.similarityScoreFunction
        });
        const { alignedSequence1, alignedSequence2, coordinateWalk } = traceback({
          sequence1,
          sequence2,
          tracebackMatrix,
          tracebackStart,
          gapSymbol: this.gapSymbol
        });
        return {
          score: alignmentScore,
          originalSequences: [sequence1, sequence2],
          alignedSequences: [alignedSequence1, alignedSequence2],
          coordinateWalk,
          scoringMatrix,
          tracebackMatrix,
          alignment: `${alignedSequence1}
${alignedSequence2}`
        };
      }
    });
    module.exports = AlignerFactory;
  }
});

// src/index.js
var require_src = __commonJS({
  "src/index.js"(exports, module) {
    var { reverse } = require_utils();
    var nwAlgorithm = require_nw_algorithm();
    var swAlgorithm = require_sw_algorithm();
    var AlignerFactory = require_aligner_factory();
    module.exports = {
      NWaligner: AlignerFactory({
        algorithm: nwAlgorithm,
        similarityScoreFunctionDefault: (char1, char2) => char1 === char2 ? 1 : -2,
        gapScoreFunctionDefault: () => -1,
        gapSymbolDefault: "-"
      }),
      SWaligner: AlignerFactory({
        algorithm: swAlgorithm,
        similarityScoreFunctionDefault: (char1, char2) => char1 === char2 ? 2 : -1,
        gapScoreFunctionDefault: reverse,
        gapSymbolDefault: "-"
      })
    };
  }
});
export default require_src();
//# sourceMappingURL=out.js.map

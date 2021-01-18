#include <stdio.h>
#include <assert.h>
#include <string>
#include <vector>
#include <map>
#include <algorithm>

#define Ef(format, ...) fprintf(stderr, format, __VA_ARGS__);

static const int CHARS = 33;

struct Word {
    std::vector<int> str;
    double freq;
    int mult;
};

struct Node {
    int wordidx;
    int next[CHARS];
};

std::map<uint32_t, int> utf8ToIdx;
std::map<int, uint32_t> idxToUtf8;

bool IsContByte(char ch) {
    return ch < char(0xC0);
}
void ConvertBytesToString(const char *src, std::vector<int> &dst) {
    int l = strlen(src);
    dst.clear();
    dst.reserve(l/2);

    int pos = 0;
    while (pos < l) {
        union {
            char bytes[4];
            uint32_t repr;
        };
        assert(!IsContByte(src[pos]));

        repr = -1;
        int q;
        for (q = 0; !q || IsContByte(src[pos + q]); q++)
            bytes[q] = src[pos + q];

        if (!utf8ToIdx.count(repr)) {
            int z = utf8ToIdx.size();
            assert(z < CHARS);
            utf8ToIdx[repr] = z;
            idxToUtf8[z] = repr;
        }
        dst.push_back(utf8ToIdx.at(repr));

        pos += q;
    }
}
void ConvertStringToBytes(const std::vector<int> &src, std::string &dst) {
    dst.clear();
    dst.reserve(src.size() * 2);

    for (int i = 0; i < src.size(); i++) {
        union {
            uint32_t repr;
            char bytes[4];
        };
        repr = idxToUtf8.at(src[i]);
        for (int j = 0; bytes[j] != -1; j++)
            dst.push_back(bytes[j]);
    }
}

std::vector<Word> ReadWords(const char *filename) {
    FILE *f = fopen(filename, "rb");

    std::vector<Word> words;

    for (int lno = 0; ; lno++) {
        char word[256];
        int mult;
        double freq;
        int q = fscanf(f, "%s%d%lf", word, &mult, &freq);
        if (q <= 0)
            break;
        assert(q >= 2);

        std::vector<int> str;
        ConvertBytesToString(word, str);

        words.push_back(Word{str, freq, mult});
    }

    fclose(f);

    return words;
}

std::vector<Node> BuildTrie(const std::vector<Word> &words) {
    std::vector<Node> trie;
    Node tmp;
    memset(&tmp, -1, sizeof(tmp));
    trie.push_back(tmp);

    for (int i = 0; i < words.size(); i++) {
        const Word &w = words[i];

        int curr = 0;
        for (int j = 0; j < w.str.size(); j++) {
            int ch = w.str[j];
            if (trie[curr].next[ch] < 0) {
                int idx = trie.size();
                trie[curr].next[ch] = idx;
                trie.push_back(tmp);
            }
            curr = trie[curr].next[ch];
        }

        int &wi = trie[curr].wordidx;
        assert(wi < 0);
        wi = i;
    }

    return trie;
}

struct SubwordsSearcher {
    const std::vector<Node> &trie;
    const std::vector<int> *haystack;

    std::vector<char> used;
    std::vector<int> found;

    SubwordsSearcher(const std::vector<Node> &trie) : trie(trie) {}

    void Rec(int l, int idx) {
        const Node &node = trie[idx];

        if (node.wordidx >= 0)
            found.push_back(node.wordidx);

        for (int i = 0; i < haystack->size(); i++) {
            int ch = (*haystack)[i];

            int next = node.next[ch];
            if (used[i] || next < 0)
                continue;

            bool dupe = false;
            for (int j = 0; j < i && !dupe; j++)
                if (ch == (*haystack)[j] && !used[j])
                    dupe = true;
            if (dupe)
                continue;   //does not matter which letter X to take if there are many

            used[i] = true;
            Rec(l + 1, next);
            used[i] = false;
        }
    }

    void Search(const std::vector<int> &_haystack, std::vector<int> &results) {
        haystack = &_haystack;
        used.assign(haystack->size(), false);
        found.clear();
        Rec(0, 0);
        results = found;
    }
};

static const int MIN_HAYSTACK_LEN = 7;
static const int MAX_HAYSTACK_LEN = 10;
static const double MIN_GOOD_FREQUENCY = 3e-5;
static const int MIN_GOOD_NEEDLES = 15;
static const int MAX_GOOD_NEEDLES = 30;
static const int ANSWER_NUMBER_LIMIT = 1000;

int main() {
    std::vector<Word> words = ReadWords("words.txt");
    std::vector<Node> trie = BuildTrie(words);
    
    std::map<int, std::vector<int> > results;
    FILE *f = fopen("result.txt", "wb");

    SubwordsSearcher searcher(trie);
    std::vector<int> subIds;
    std::string u8str;
    int lastPercent = -1;
    for (int i = 0; i < words.size(); i++) {
        int percent = i * 100 / words.size();
        if (percent > lastPercent) {
            printf("%d%% ", percent);
            lastPercent = percent;
        }

        if (words[i].str.size() < MIN_HAYSTACK_LEN)
            continue;
        if (words[i].str.size() > MAX_HAYSTACK_LEN)
            continue;

        searcher.Search(words[i].str, subIds);
        std::sort(subIds.begin(), subIds.end(), [&words](int a, int b) -> bool {
            if (words[a].freq == words[b].freq)
                return words[a].freq > words[b].freq;
            return a < b;
        });

        int kGood = 0;
        while (kGood < subIds.size() && words[subIds[kGood]].freq >= MIN_GOOD_FREQUENCY)
            kGood++;

        if (kGood < MIN_GOOD_NEEDLES || kGood > MAX_GOOD_NEEDLES)
            continue;

        subIds.resize(std::remove(subIds.begin(), subIds.end(), i) - subIds.begin());

        results[i] = subIds;

        ConvertStringToBytes(words[i].str, u8str);
        fprintf(f, "%s\n", u8str.c_str());
        for (int j = 0; j < subIds.size(); j++) {
            const Word &sw = words[subIds[j]];
            ConvertStringToBytes(sw.str, u8str);
            fprintf(f, "  %s %d %0.6lf\n", u8str.c_str(), sw.mult, sw.freq);
        }
        fflush(f);
    }

    fclose(f);

    fprintf(stderr, "\nFound %d cases\n", int(results.size()));
    std::vector<std::pair<int, std::vector<int>>> jsonRes(results.begin(), results.end());
    srand(666);
    std::random_shuffle(jsonRes.begin(), jsonRes.end());
    if (jsonRes.size() > ANSWER_NUMBER_LIMIT)
        jsonRes.resize(ANSWER_NUMBER_LIMIT);

    f = fopen("data.js", "wb");
    fprintf(f, "data = {\n");
    for (const auto &pKV : jsonRes) {
        int i = pKV.first;
        const auto &subIds = pKV.second;

        ConvertStringToBytes(words[i].str, u8str);
        fprintf(f, "  \"%s\": [\n", u8str.c_str());
        for (int j = 0; j < subIds.size(); j++) {
            const Word &sw = words[subIds[j]];
            ConvertStringToBytes(sw.str, u8str);
            fprintf(f, "    [\"%s\", %d, %0.6lf],\n", u8str.c_str(), sw.mult, sw.freq);
        }
        fprintf(f, "  ],\n");
        fflush(f);
    }
    fprintf(f, "};\n");
    fprintf(f, "MIN_GOOD_FREQUENCY = %.2g;\n", MIN_GOOD_FREQUENCY);
    fclose(f);

    return 0;
}

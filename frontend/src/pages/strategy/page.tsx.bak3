import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import BoardCard from "../../components/layout/boardCard";

interface OptionRow {
  id: string;
  probability: number; // % (0~100)
  value: number;
}

interface Candidate {
  id: string;
  label: string;
  currentValue: number; // V_U: 현재 옵션(매몰) 가치
  legendaryValue: number; // V_L
  legendaryProbability: number; // P_L, % (0~100)
  pityConfirmed: boolean; // 다음 1회로 확정 등급업인지
  options: OptionRow[]; // 유효 옵션들 (P_i, V_i)
}

function createOptionRow(): OptionRow {
  return { id: Math.random().toString(36).slice(2), probability: 0, value: 0 };
}

function createCandidate(): Candidate {
  return {
    id: Math.random().toString(36).slice(2),
    label: "새 장비",
    currentValue: 0,
    legendaryValue: 0,
    legendaryProbability: 0,
    pityConfirmed: false,
    options: [createOptionRow()],
  };
}

function calc(candidate: Candidate) {
  const pL = candidate.legendaryProbability / 100;
  const optionEV = candidate.options.reduce(
    (sum, o) => sum + (o.probability / 100) * o.value,
    0
  );
  const ev = pL * candidate.legendaryValue + optionEV;
  const deltaE = ev - candidate.currentValue;
  const netGain = candidate.legendaryValue - candidate.currentValue;

  return { ev, deltaE, netGain };
}

export default function Strategy() {
  const [candidates, setCandidates] = useState<Candidate[]>([createCandidate()]);

  const updateCandidate = (id: string, patch: Partial<Candidate>) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id == id ? { ...c, ...patch } : c))
    );
  };
  const updateOption = (
    candidateId: string,
    optionId: string,
    patch: Partial<OptionRow>
  ) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id != candidateId
          ? c
          : {
              ...c,
              options: c.options.map((o) =>
                o.id == optionId ? { ...o, ...patch } : o
              ),
            }
      )
    );
  };

  const results = useMemo(() => {
    const computed = candidates.map((c) => ({ candidate: c, ...calc(c) }));
    const anyConfirmed = computed.some((c) => c.candidate.pityConfirmed);

    let recommendedId: string | undefined;
    if (anyConfirmed) {
      const confirmedOnes = computed.filter((c) => c.candidate.pityConfirmed);
      recommendedId = confirmedOnes.reduce((best, cur) =>
        cur.netGain > best.netGain ? cur : best
      ).candidate.id;
    } else if (computed.length) {
      recommendedId = computed.reduce((best, cur) =>
        cur.deltaE > best.deltaE ? cur : best
      ).candidate.id;
    }

    return { computed, anyConfirmed, recommendedId };
  }, [candidates]);

  return (
    <BoardCard order={1} title="전략 계산기">
      <Stack gap={4} width={{ base: "100%", md: "container.md" }}>
        <Text fontSize="sm" color="gray.500">
          지금 이 순간, 재설정 1회를 어느 장비에 쓰는 게 수학적으로 유리한지
          알려줍니다. 재설정할 때마다 값(확률, 현재 옵션 가치 등)을 갱신하고
          다시 확인하세요.
        </Text>
        <Text fontSize="xs" color="gray.500">
          · 천장이 확정(다음 1회로 100% 등급업)인 장비가 있으면, 그 중{" "}
          <b>레전드리 가치 − 현재 옵션 가치</b>가 가장 큰 장비를 추천합니다.
          <br />· 아니라면 모든 장비 중{" "}
          <b>기대값(EV) − 현재 옵션 가치</b>가 가장 큰(0에 가까운) 장비를
          추천합니다.
        </Text>

        {candidates.map((c) => {
          const r = results.computed.find((x) => x.candidate.id == c.id)!;
          const isRecommended = results.recommendedId == c.id;

          return (
            <Box
              key={c.id}
              borderWidth={2}
              borderColor={isRecommended ? "green.400" : "inherit"}
              borderRadius={8}
              p={3}
              position="relative"
            >
              <IconButton
                aria-label="delete"
                icon={<LuTrash2 size={14} />}
                size="xs"
                position="absolute"
                top={2}
                right={2}
                variant="ghost"
                colorScheme="red"
                onClick={() =>
                  setCandidates((prev) => prev.filter((x) => x.id != c.id))
                }
              />
              <Stack gap={2}>
                <Flex align="center" gap={2}>
                  <Input
                    size="sm"
                    width="200px"
                    value={c.label}
                    onChange={(e) =>
                      updateCandidate(c.id, { label: e.target.value })
                    }
                  />
                  {isRecommended && <Badge colorScheme="green">추천</Badge>}
                </Flex>

                <Checkbox
                  size="sm"
                  isChecked={c.pityConfirmed}
                  onChange={(e) =>
                    updateCandidate(c.id, { pityConfirmed: e.target.checked })
                  }
                >
                  다음 1회로 천장 확정 (등급업 100%)
                </Checkbox>

                <Flex gap={2} wrap="wrap" align="center">
                  <Text fontSize="xs" whiteSpace="nowrap">
                    현재 옵션 가치 (V_U)
                  </Text>
                  <NumberInput
                    size="sm"
                    width="140px"
                    value={c.currentValue}
                    onChange={(_, v) =>
                      updateCandidate(c.id, { currentValue: isNaN(v) ? 0 : v })
                    }
                  >
                    <NumberInputField />
                  </NumberInput>

                  <Text fontSize="xs" whiteSpace="nowrap">
                    레전드리 가치 (V_L)
                  </Text>
                  <NumberInput
                    size="sm"
                    width="140px"
                    value={c.legendaryValue}
                    onChange={(_, v) =>
                      updateCandidate(c.id, {
                        legendaryValue: isNaN(v) ? 0 : v,
                      })
                    }
                  >
                    <NumberInputField />
                  </NumberInput>

                  {!c.pityConfirmed && (
                    <>
                      <Text fontSize="xs" whiteSpace="nowrap">
                        등급업 확률 P_L(%)
                      </Text>
                      <NumberInput
                        size="sm"
                        width="100px"
                        value={c.legendaryProbability}
                        onChange={(_, v) =>
                          updateCandidate(c.id, {
                            legendaryProbability: isNaN(v) ? 0 : v,
                          })
                        }
                        min={0}
                        max={100}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </>
                  )}
                </Flex>

                {!c.pityConfirmed && (
                  <Stack gap={1}>
                    <Text fontSize="xs" fontWeight="bold">
                      유효 옵션 목록 (P_i, V_i)
                    </Text>
                    {c.options.map((o) => (
                      <Flex key={o.id} gap={2} align="center">
                        <NumberInput
                          size="sm"
                          width="100px"
                          value={o.probability}
                          onChange={(_, v) =>
                            updateOption(c.id, o.id, {
                              probability: isNaN(v) ? 0 : v,
                            })
                          }
                          min={0}
                          max={100}
                        >
                          <NumberInputField placeholder="확률%" />
                        </NumberInput>
                        <NumberInput
                          size="sm"
                          width="140px"
                          value={o.value}
                          onChange={(_, v) =>
                            updateOption(c.id, o.id, {
                              value: isNaN(v) ? 0 : v,
                            })
                          }
                        >
                          <NumberInputField placeholder="가치" />
                        </NumberInput>
                        <IconButton
                          aria-label="delete-option"
                          icon={<LuTrash2 size={12} />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() =>
                            updateCandidate(c.id, {
                              options: c.options.filter((x) => x.id != o.id),
                            })
                          }
                        />
                      </Flex>
                    ))}
                    <Button
                      size="xs"
                      leftIcon={<LuPlus size={12} />}
                      alignSelf="start"
                      onClick={() =>
                        updateCandidate(c.id, {
                          options: [...c.options, createOptionRow()],
                        })
                      }
                    >
                      옵션 추가
                    </Button>
                  </Stack>
                )}

                <Box pt={2} borderTopWidth={1}>
                  {c.pityConfirmed ? (
                    <Text fontSize="sm">
                      Net Gain (V_L - V_U):{" "}
                      <b>{r.netGain.toLocaleString()}</b>
                    </Text>
                  ) : (
                    <>
                      <Text fontSize="sm">EV: {r.ev.toLocaleString()}</Text>
                      <Text fontSize="sm">
                        ΔE (EV - V_U): <b>{r.deltaE.toLocaleString()}</b>
                      </Text>
                    </>
                  )}
                </Box>
              </Stack>
            </Box>
          );
        })}

        <Button
          size="sm"
          leftIcon={<LuPlus />}
          onClick={() => setCandidates((prev) => [...prev, createCandidate()])}
        >
          장비 추가
        </Button>
      </Stack>
    </BoardCard>
  );
}

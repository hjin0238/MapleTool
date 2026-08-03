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
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { LuPlus, LuTrash2, LuChevronUp, LuChevronDown } from "react-icons/lu";
import {
  MATERIAL_INFOS,
  MATERIAL_TYPE,
} from "../../constants/enhance/material";
import {
  POTENTIAL_CRITERIA,
  POTENTIAL_GRADE,
  POTENTIAL_INFOS,
} from "../../constants/enhance/potential";
import { calcRollingMaterials, isAddi } from "../../services/enhance/potential";
import BoardCard from "../../components/layout/boardCard";

interface StrategyItem {
  id: string;
  label: string;
  materialType: MATERIAL_TYPE;
  level: number;
  currentGrade: POTENTIAL_GRADE;
  currentGuarantee: number;
  doubleUpgrade: boolean;
  baseValue: number;
  wantsOption: boolean;
  optionProbability: number; // 0~100
  optionValue: number;
  legendaryValue: number;
  groupId?: string;
}

interface PityGroup {
  id: string;
  materialType: MATERIAL_TYPE;
  grade: POTENTIAL_GRADE;
  sharedGuarantee: number;
  memberOrder: string[]; // item id 순서
}

const MATERIAL_OPTIONS = Object.keys(POTENTIAL_CRITERIA) as MATERIAL_TYPE[];
const GRADES = Object.values(POTENTIAL_GRADE);
const TRIALS = 3000;

function createDefaultItem(): StrategyItem {
  return {
    id: Math.random().toString(36).slice(2),
    label: "새 장비",
    materialType: MATERIAL_OPTIONS[0],
    level: 250,
    currentGrade: POTENTIAL_GRADE.RARE,
    currentGuarantee: 0,
    doubleUpgrade: false,
    baseValue: 0,
    wantsOption: true,
    optionProbability: 5,
    optionValue: 0,
    legendaryValue: 0,
  };
}

function costPerRoll(
  materialType: MATERIAL_TYPE,
  level: number,
  grade: POTENTIAL_GRADE
) {
  const materials = calcRollingMaterials(
    materialType,
    level,
    isAddi(materialType),
    grade
  );
  return materials.find((m) => m.name.startsWith("메소"))?.value ?? 0;
}

// 한 아이템을 startGrade/startGuarantee 상태에서 시작해,
// (옵션 성공 또는 최종 등급 도달) 조건을 만족할 때까지 한 번 시뮬레이션
function simulateOnce(
  item: StrategyItem,
  startGrade: POTENTIAL_GRADE,
  startGuarantee: number
) {
  let grade = startGrade;
  let guarantee = startGuarantee;
  let cost = 0;
  let value: number | undefined;
  let endGrade = startGrade;
  let endGuarantee = startGuarantee;

  const legendaryIndex = GRADES.length - 1;

  if (GRADES.indexOf(grade) >= legendaryIndex) {
    return {
      cost: 0,
      value: item.legendaryValue,
      endGrade: grade,
      endGuarantee: 0,
    };
  }

  // 무한루프 방지용 안전장치
  for (let i = 0; i < 100000; i++) {
    const criteria = POTENTIAL_CRITERIA[item.materialType]?.[grade];
    if (!criteria) {
      return { cost: Infinity, value: 0, endGrade: grade, endGuarantee: guarantee };
    }
    const bound = criteria.bound;
    const upgradeChance = item.doubleUpgrade
      ? Math.min(criteria.upgrade * 2, 1)
      : criteria.upgrade;

    cost += costPerRoll(item.materialType, item.level, grade);

    const forcedByPity = bound > 0 && guarantee >= bound;
    const advances = forcedByPity || Math.random() < upgradeChance;

    if (advances) {
      const nextIndex = GRADES.indexOf(grade) + 1;
      grade = GRADES[nextIndex];
      guarantee = 0;

      if (nextIndex >= legendaryIndex) {
        value = item.legendaryValue;
        endGrade = grade;
        endGuarantee = 0;
        break;
      }
      continue; // 중간 등급으로 승급, 계속 굴림
    }

    // 이번 굴리기에서는 승급 안 됨 → 이 등급에서 옵션 체크
    if (grade == POTENTIAL_GRADE.UNIQUE && item.wantsOption) {
      const optionHit = Math.random() < item.optionProbability / 100;
      guarantee += 1;
      if (optionHit) {
        value = item.optionValue;
        endGrade = grade;
        endGuarantee = guarantee;
        break;
      }
      continue;
    }

    guarantee += 1;
  }

  if (value === undefined) {
    // 100000회 넘게 못 끝난 이상 상황 (확률 0 등)
    return { cost: Infinity, value: 0, endGrade, endGuarantee };
  }

  return { cost, value, endGrade, endGuarantee };
}

function simulateStandalone(item: StrategyItem) {
  let totalCost = 0;
  let totalValueGain = 0;
  let unreachable = false;

  for (let t = 0; t < TRIALS; t++) {
    const result = simulateOnce(item, item.currentGrade, item.currentGuarantee);
    if (!isFinite(result.cost)) {
      unreachable = true;
      break;
    }
    totalCost += result.cost;
    totalValueGain += result.value - item.baseValue;
  }

  if (unreachable) return { expectedCost: Infinity, expectedValueGain: 0, reachable: false };

  return {
    expectedCost: totalCost / TRIALS,
    expectedValueGain: totalValueGain / TRIALS,
    reachable: true,
  };
}

function simulateGroup(group: PityGroup, members: StrategyItem[]) {
  let totalCost = 0;
  let totalValueGain = 0;
  let unreachable = false;

  for (let t = 0; t < TRIALS; t++) {
    let guarantee = group.sharedGuarantee;
    let trialCost = 0;
    let trialValueGain = 0;

    for (const item of members) {
      const result = simulateOnce(item, group.grade, guarantee);
      if (!isFinite(result.cost)) {
        unreachable = true;
        break;
      }
      trialCost += result.cost;
      trialValueGain += result.value - item.baseValue;
      guarantee = result.endGrade == group.grade ? result.endGuarantee : 0;
    }

    if (unreachable) break;
    totalCost += trialCost;
    totalValueGain += trialValueGain;
  }

  if (unreachable) return { expectedCost: Infinity, expectedValueGain: 0, reachable: false };

  return {
    expectedCost: totalCost / TRIALS,
    expectedValueGain: totalValueGain / TRIALS,
    reachable: true,
  };
}

export default function Strategy() {
  const [items, setItems] = useState<StrategyItem[]>([createDefaultItem()]);
  const [groups, setGroups] = useState<PityGroup[]>([]);
  const [budget, setBudget] = useState(0);

  const updateItem = (id: string, patch: Partial<StrategyItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id == id ? { ...item, ...patch } : item))
    );
  };

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        materialType: MATERIAL_OPTIONS[0],
        grade: POTENTIAL_GRADE.UNIQUE,
        sharedGuarantee: 0,
        memberOrder: [],
      },
    ]);
  };

  const removeGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id != groupId));
    setItems((prev) =>
      prev.map((item) =>
        item.groupId == groupId ? { ...item, groupId: undefined } : item
      )
    );
  };

  const toggleMember = (group: PityGroup, itemId: string, checked: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id == itemId
          ? { ...item, groupId: checked ? group.id : undefined }
          : item
      )
    );
    setGroups((prev) =>
      prev.map((g) =>
        g.id != group.id
          ? g
          : {
              ...g,
              memberOrder: checked
                ? [...g.memberOrder, itemId]
                : g.memberOrder.filter((id) => id != itemId),
            }
      )
    );
  };

  const moveMember = (group: PityGroup, itemId: string, direction: -1 | 1) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id != group.id) return g;
        const order = [...g.memberOrder];
        const idx = order.indexOf(itemId);
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= order.length) return g;
        [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
        return { ...g, memberOrder: order };
      })
    );
  };

  const results = useMemo(() => {
    const groupedIds = new Set(groups.flatMap((g) => g.memberOrder));
    const standaloneItems = items.filter((item) => !groupedIds.has(item.id));

    const units: {
      key: string;
      label: string;
      expectedCost: number;
      expectedValueGain: number;
      reachable: boolean;
      memberLabels?: string[];
    }[] = [];

    standaloneItems.forEach((item) => {
      const r = simulateStandalone(item);
      units.push({ key: item.id, label: item.label, ...r });
    });

    groups.forEach((group) => {
      const members = group.memberOrder
        .map((id) => items.find((i) => i.id == id))
        .filter((i): i is StrategyItem => !!i);
      if (!members.length) return;
      const r = simulateGroup(group, members);
      units.push({
        key: group.id,
        label: `[공유천장] ${MATERIAL_INFOS[group.materialType].name} ${
          POTENTIAL_INFOS[group.grade].name
        }`,
        ...r,
        memberLabels: members.map((m) => m.label),
      });
    });

    const withRatio = units.map((u) => ({
      ...u,
      ratio: u.expectedCost > 0 ? u.expectedValueGain / u.expectedCost : 0,
    }));
    const sorted = [...withRatio].sort((a, b) => b.ratio - a.ratio);

    let remaining = budget;
    let totalValueGain = 0;
    const allocation = new Map<string, boolean>();

    sorted.forEach(({ key, expectedCost, expectedValueGain, reachable }) => {
      if (reachable && remaining >= expectedCost) {
        remaining -= expectedCost;
        totalValueGain += expectedValueGain;
        allocation.set(key, true);
      } else {
        allocation.set(key, false);
      }
    });

    return { sorted, remaining, totalValueGain, allocation };
  }, [items, groups, budget]);

  return (
    <BoardCard order={1} title="전략 계산기">
      <Stack gap={4} width={{ base: "100%", md: "container.md" }}>
        <Text fontSize="sm" color="gray.500">
          시뮬레이션(3000회 평균) 기반으로, 예산을 어디에 먼저 쓰는 게
          유리한지 우선순위를 제안합니다. 같은 재료+등급 장비는 아래
          "공유 천장 그룹"으로 묶으면 천장 카운터를 이어받는 전략까지
          계산됩니다.
        </Text>

        <Flex align="center" gap={2}>
          <Text fontSize="sm" whiteSpace="nowrap">
            보유 메소
          </Text>
          <NumberInput
            size="sm"
            value={budget}
            onChange={(_, v) => setBudget(isNaN(v) ? 0 : v)}
            min={0}
          >
            <NumberInputField />
          </NumberInput>
        </Flex>

        <Text fontWeight="bold">장비 목록</Text>
        {items.map((item) => (
          <Box
            key={item.id}
            borderWidth={1}
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
                setItems((prev) => prev.filter((i) => i.id != item.id))
              }
            />
            <Stack gap={2}>
              <Flex align="center" gap={2}>
                <Input
                  size="sm"
                  width="200px"
                  value={item.label}
                  onChange={(e) =>
                    updateItem(item.id, { label: e.target.value })
                  }
                />
                {item.groupId && (
                  <Badge colorScheme="purple">그룹에 포함됨</Badge>
                )}
              </Flex>

              <Flex gap={2} wrap="wrap" align="center">
                <Select
                  size="sm"
                  width="180px"
                  value={item.materialType}
                  isDisabled={!!item.groupId}
                  onChange={(e) =>
                    updateItem(item.id, {
                      materialType: e.target.value as MATERIAL_TYPE,
                    })
                  }
                >
                  {MATERIAL_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {MATERIAL_INFOS[m].name}
                    </option>
                  ))}
                </Select>

                <NumberInput
                  size="sm"
                  width="100px"
                  value={item.level}
                  onChange={(_, v) =>
                    updateItem(item.id, { level: isNaN(v) ? 0 : v })
                  }
                  min={0}
                >
                  <NumberInputField placeholder="레벨" />
                </NumberInput>

                <Select
                  size="sm"
                  width="120px"
                  value={item.currentGrade}
                  isDisabled={!!item.groupId}
                  onChange={(e) =>
                    updateItem(item.id, {
                      currentGrade: e.target.value as POTENTIAL_GRADE,
                    })
                  }
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {POTENTIAL_INFOS[g].name}
                    </option>
                  ))}
                </Select>

                <NumberInput
                  size="sm"
                  width="140px"
                  value={item.currentGuarantee}
                  isDisabled={!!item.groupId}
                  onChange={(_, v) =>
                    updateItem(item.id, {
                      currentGuarantee: isNaN(v) ? 0 : v,
                    })
                  }
                  min={0}
                >
                  <NumberInputField placeholder="현재 천장 카운터" />
                </NumberInput>

                <Checkbox
                  size="sm"
                  isChecked={item.doubleUpgrade}
                  onChange={(e) =>
                    updateItem(item.id, { doubleUpgrade: e.target.checked })
                  }
                >
                  미라클
                </Checkbox>
              </Flex>

              <Flex gap={2} wrap="wrap" align="center">
                <Text fontSize="xs" whiteSpace="nowrap">
                  기본 가치
                </Text>
                <NumberInput
                  size="sm"
                  width="140px"
                  value={item.baseValue}
                  onChange={(_, v) =>
                    updateItem(item.id, { baseValue: isNaN(v) ? 0 : v })
                  }
                  min={0}
                >
                  <NumberInputField />
                </NumberInput>

                <Text fontSize="xs" whiteSpace="nowrap">
                  레전드리 가치
                </Text>
                <NumberInput
                  size="sm"
                  width="140px"
                  value={item.legendaryValue}
                  onChange={(_, v) =>
                    updateItem(item.id, {
                      legendaryValue: isNaN(v) ? 0 : v,
                    })
                  }
                  min={0}
                >
                  <NumberInputField />
                </NumberInput>
              </Flex>

              <Flex gap={2} wrap="wrap" align="center">
                <Checkbox
                  size="sm"
                  isChecked={item.wantsOption}
                  onChange={(e) =>
                    updateItem(item.id, { wantsOption: e.target.checked })
                  }
                >
                  유니크 유효 옵션도 성공으로 인정
                </Checkbox>
                {item.wantsOption && (
                  <>
                    <Text fontSize="xs" whiteSpace="nowrap">
                      유효 옵션 확률(%)
                    </Text>
                    <NumberInput
                      size="sm"
                      width="100px"
                      value={item.optionProbability}
                      onChange={(_, v) =>
                        updateItem(item.id, {
                          optionProbability: isNaN(v) ? 0 : v,
                        })
                      }
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                    </NumberInput>
                    <Text fontSize="xs" whiteSpace="nowrap">
                      유효 옵션 가치
                    </Text>
                    <NumberInput
                      size="sm"
                      width="140px"
                      value={item.optionValue}
                      onChange={(_, v) =>
                        updateItem(item.id, {
                          optionValue: isNaN(v) ? 0 : v,
                        })
                      }
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </>
                )}
              </Flex>
            </Stack>
          </Box>
        ))}

        <Button
          size="sm"
          leftIcon={<LuPlus />}
          onClick={() => setItems((prev) => [...prev, createDefaultItem()])}
        >
          장비 추가
        </Button>

        <Text fontWeight="bold" pt={2}>
          공유 천장 그룹
        </Text>
        <Text fontSize="xs" color="gray.500">
          같은 재료 + 같은 등급인 장비들을 묶고 순서를 정하면, 앞 장비가
          "옵션으로만" 성공했을 때 남은 천장 진행도가 다음 장비로 이어지는
          전략을 계산합니다.
        </Text>

        {groups.map((group) => {
          const eligibleItems = items.filter(
            (item) =>
              item.materialType == group.materialType &&
              item.currentGrade == group.grade &&
              (!item.groupId || item.groupId == group.id)
          );

          return (
            <Box key={group.id} borderWidth={1} borderRadius={8} p={3} position="relative">
              <IconButton
                aria-label="delete-group"
                icon={<LuTrash2 size={14} />}
                size="xs"
                position="absolute"
                top={2}
                right={2}
                variant="ghost"
                colorScheme="red"
                onClick={() => removeGroup(group.id)}
              />
              <Stack gap={2}>
                <Flex gap={2} wrap="wrap" align="center">
                  <Select
                    size="sm"
                    width="180px"
                    value={group.materialType}
                    onChange={(e) =>
                      setGroups((prev) =>
                        prev.map((g) =>
                          g.id == group.id
                            ? {
                                ...g,
                                materialType: e.target.value as MATERIAL_TYPE,
                                memberOrder: [],
                              }
                            : g
                        )
                      )
                    }
                  >
                    {MATERIAL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {MATERIAL_INFOS[m].name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    size="sm"
                    width="120px"
                    value={group.grade}
                    onChange={(e) =>
                      setGroups((prev) =>
                        prev.map((g) =>
                          g.id == group.id
                            ? {
                                ...g,
                                grade: e.target.value as POTENTIAL_GRADE,
                                memberOrder: [],
                              }
                            : g
                        )
                      )
                    }
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {POTENTIAL_INFOS[g].name}
                      </option>
                    ))}
                  </Select>

                  <Text fontSize="xs" whiteSpace="nowrap">
                    공유 천장 카운터
                  </Text>
                  <NumberInput
                    size="sm"
                    width="140px"
                    value={group.sharedGuarantee}
                    onChange={(_, v) =>
                      setGroups((prev) =>
                        prev.map((g) =>
                          g.id == group.id
                            ? { ...g, sharedGuarantee: isNaN(v) ? 0 : v }
                            : g
                        )
                      )
                    }
                    min={0}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Flex>

                <Text fontSize="xs" fontWeight="bold">
                  그룹에 포함할 장비 (재료+등급 일치하는 것만 표시)
                </Text>
                <Stack gap={1}>
                  {eligibleItems.map((item) => {
                    const inGroup = group.memberOrder.includes(item.id);
                    const order = group.memberOrder.indexOf(item.id);
                    return (
                      <Flex key={item.id} align="center" gap={2}>
                        <Checkbox
                          size="sm"
                          isChecked={inGroup}
                          onChange={(e) =>
                            toggleMember(group, item.id, e.target.checked)
                          }
                        >
                          {item.label}
                        </Checkbox>
                        {inGroup && (
                          <>
                            <Badge>{order + 1}순서</Badge>
                            <IconButton
                              aria-label="up"
                              icon={<LuChevronUp size={12} />}
                              size="xs"
                              variant="ghost"
                              onClick={() => moveMember(group, item.id, -1)}
                            />
                            <IconButton
                              aria-label="down"
                              icon={<LuChevronDown size={12} />}
                              size="xs"
                              variant="ghost"
                              onClick={() => moveMember(group, item.id, 1)}
                            />
                          </>
                        )}
                      </Flex>
                    );
                  })}
                  {!eligibleItems.length && (
                    <Text fontSize="xs" color="gray.400">
                      이 재료+등급 조합의 장비가 없습니다. 위 장비 목록에서
                      먼저 만들어주세요.
                    </Text>
                  )}
                </Stack>
              </Stack>
            </Box>
          );
        })}

        <Button size="sm" leftIcon={<LuPlus />} onClick={addGroup}>
          공유 천장 그룹 추가
        </Button>

        <Box borderWidth={1} borderRadius={8} p={3}>
          <Text fontWeight="bold" pb={2}>
            계산 결과 (기대값 대비 효율 순)
          </Text>
          <Stack gap={2}>
            {results.sorted.map(
              (
                { key, label, expectedCost, expectedValueGain, reachable, memberLabels },
                i
              ) => (
                <Box key={key}>
                  <Flex align="center" gap={2} wrap="wrap">
                    <Badge
                      colorScheme={results.allocation.get(key) ? "green" : "gray"}
                    >
                      {i + 1}순위
                    </Badge>
                    <Text fontSize="sm" fontWeight="bold">
                      {label}
                    </Text>
                    {!reachable ? (
                      <Text fontSize="sm" color="red.400">
                        계산 불가 (재료 설정 확인)
                      </Text>
                    ) : (
                      <>
                        <Text fontSize="sm">
                          기대 비용: {Math.round(expectedCost).toLocaleString()}메소
                        </Text>
                        <Text fontSize="sm">
                          기대 가치 증가:{" "}
                          {Math.round(expectedValueGain).toLocaleString()}
                        </Text>
                        <Text fontSize="sm">
                          {results.allocation.get(key)
                            ? "예산 내 완료 가능"
                            : "예산 부족"}
                        </Text>
                      </>
                    )}
                  </Flex>
                  {memberLabels && (
                    <Text fontSize="xs" color="gray.500" pl={8}>
                      순서: {memberLabels.join(" → ")}
                    </Text>
                  )}
                </Box>
              )
            )}
            <Text fontSize="sm" pt={2}>
              남는 예산: {Math.round(results.remaining).toLocaleString()}메소
            </Text>
            <Text fontSize="sm" fontWeight="bold">
              예상 총 가치 증가:{" "}
              {Math.round(results.totalValueGain).toLocaleString()}
            </Text>
          </Stack>
        </Box>
      </Stack>
    </BoardCard>
  );
}

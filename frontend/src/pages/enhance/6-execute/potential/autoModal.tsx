import {
  Badge,
  Box,
  Button,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import PotentialResponse from "../../../../types/character/itemEquipment/potential/potentialResponse";
import {
  MAX_POTENTIALS,
  POTENTIAL_GRADE,
  POTENTIAL_INFOS,
} from "../../../../constants/enhance/potential";
import PotentialConditionSet from "../../../../types/character/itemEquipment/potential/potentialConditionSet";
import {
  Select,
  chakraComponents,
  GroupBase,
  SelectComponentsConfig,
} from "chakra-react-select";
import ConditionInfos from "../../../../types/character/itemEquipment/potential/conditionInfos";
import { useMemo } from "react";
import {
  calcConditionInfos,
  calcProbabilityByConditions,
} from "../../../../services/enhance/potentialCondition";
import {
  getPotentialIcon,
  parseGrade,
} from "../../../../services/enhance/potential";
import PotentialCondition from "../../../../types/character/itemEquipment/potential/potentialCondition";

interface Option {
  label: string;
  value: string;
  grades: Set<string>;
}

export default function AutoModal({
  isOpen,
  onClose,
  grade,
  potentialInfos,
  conditionGrid,
  setConditionGrid,
}: {
  isOpen: boolean;
  onClose: () => void;
  grade: POTENTIAL_GRADE;
  potentialInfos: PotentialResponse[];
  conditionGrid: PotentialConditionSet[];
  setConditionGrid: (value: PotentialConditionSet[]) => void;
}) {
  const conditionInfos = useMemo(
    () => calcConditionInfos(potentialInfos),
    [potentialInfos],
  );
  const selectOptions = useMemo(
    () => convertConditionInfosToSelectOptions(conditionInfos),
    [conditionInfos],
  );

  const components: SelectComponentsConfig<Option, false, GroupBase<Option>> = {
    Option: ({ children, ...props }) => (
      <chakraComponents.Option {...props}>
        {children}
        <Spacer />
        {[...props.data.grades].map((grade) => (
          <Image key={grade} src={getPotentialIcon(grade)} />
        ))}
      </chakraComponents.Option>
    ),
  };

  const onChange = (
    newCondition?: PotentialCondition,
    setIndex?: number,
    optionIndex?: number,
  ) => {
    const temp = [...conditionGrid];

    if (!newCondition) {
      if (setIndex == undefined) return;
      if (optionIndex == undefined) {
        temp.splice(setIndex, 1);
        setConditionGrid(temp);
        return;
      }
      temp[setIndex] = {
        ...temp[setIndex],
        conditions: temp[setIndex].conditions.filter(
          (_, i) => i != optionIndex,
        ),
      };
      setConditionGrid(temp);
      return;
    }

    if (setIndex == undefined) {
      temp.push({ conditions: [newCondition] });
    } else if (optionIndex == undefined) {
      temp[setIndex] = {
        ...temp[setIndex],
        conditions: [...temp[setIndex].conditions, newCondition],
      };
    } else {
      const conditions = [...temp[setIndex].conditions];
      conditions[optionIndex] = newCondition;
      temp[setIndex] = { ...temp[setIndex], conditions };
    }

    setConditionGrid(temp);
  };

  const onGradeChange = (
    setIndex: number | undefined,
    targetGrade?: POTENTIAL_GRADE,
  ) => {
    const temp = [...conditionGrid];

    if (setIndex == undefined) {
      // "추가" 행에서 옵션 없이 등급만 고른 경우 → 새 세트 생성
      if (!targetGrade) return;
      temp.push({ conditions: [], targetGrade });
      setConditionGrid(temp);
      return;
    }

    temp[setIndex] = { ...temp[setIndex], targetGrade };
    setConditionGrid(temp);
  };

  const Row = ({
    title,
    set,
    onCreate,
    onUpdate,
    onDelete,
    onGrade,
  }: {
    title: string;
    set?: PotentialConditionSet;
    onCreate?: (value: PotentialCondition) => void;
    onUpdate?: (value: PotentialCondition, setIndex: number) => void;
    onDelete?: (optionIndex?: number) => void;
    onGrade?: (targetGrade?: POTENTIAL_GRADE) => void;
  }) => {
    const conditions = set?.conditions;
    const probabilitByConditions = calcProbabilityByConditions(
      potentialInfos,
      conditionInfos,
      conditions ?? [],
    );
    const probKeys = Object.keys(probabilitByConditions);
    const isCompatible =
      probKeys.length &&
      isGradeLessOrEqualThan(grade, probKeys[probKeys.length - 1]);

    const gradeOptions = Object.values(POTENTIAL_GRADE).map((g) => ({
      label: POTENTIAL_INFOS[g].name,
      value: g,
    }));

    return (
      <Stack pb={4}>
        <Flex align="center" gap={1}>
          <Badge
            colorScheme={
              !conditions ? undefined : isCompatible ? "green" : "red"
            }
          >
            {title}
          </Badge>
          {Object.entries(probabilitByConditions).map(
            ([grade, probability]) => {
              const readableProbability =
                probability < 0.01
                  ? (probability * 100).toPrecision(2)
                  : (probability * 100).toFixed(2);
              const readablecount = Math.ceil(1 / probability).toLocaleString();

              return (
                <Tooltip
                  key={"expect-" + grade}
                  size="xs"
                  placement="top"
                  label={
                    <Box>
                      <Text>{`확률: ${readableProbability}%`}</Text>
                      <Text>{`평균 기대 횟수: ${readablecount}`}</Text>
                    </Box>
                  }
                >
                  <Button size="xs" h={5} px={1} py={0} cursor="default">
                    <Image src={getPotentialIcon(grade)} pr={1} />
                    {readablecount}
                  </Button>
                </Tooltip>
              );
            },
          )}
          <Spacer />
          {title.endsWith("추가") || (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => (onDelete ? onDelete() : undefined)}
            >
              삭제
            </Button>
          )}
        </Flex>

        <Flex gap={2} align="center">
          <Text fontSize="sm" whiteSpace="nowrap">
            도달 시 마무리 등급
          </Text>
          <Box w={32}>
            <Select
              size="sm"
              placeholder="선택 안 함"
              isClearable
              value={
                set?.targetGrade
                  ? {
                      label: POTENTIAL_INFOS[set.targetGrade].name,
                      value: set.targetGrade,
                    }
                  : null
              }
              options={gradeOptions}
              onChange={(option) =>
                onGrade && onGrade(option?.value as POTENTIAL_GRADE)
              }
            />
          </Box>
        </Flex>

        {conditions?.map((condition, i) => (
          <Flex key={"condition-" + i} gap={2}>
            <Box flex={1}>
              <Select
                size="sm"
                components={components}
                value={{
                  label: condition.name,
                  value: condition.name,
                  grades: condition.grades,
                }}
                options={selectOptions}
                isOptionDisabled={(option) =>
                  conditions.some(({ name }) => name == option.label)
                }
                onChange={(option) => {
                  if (!option) {
                    if (onDelete) onDelete(i);
                    return;
                  }

                  if (!onUpdate) return;
                  const infosByName = conditionInfos[option.label];
                  const value = Number(Object.keys(infosByName)[0]);
                  const grades = new Set(Object.keys(infosByName[value]));

                  onUpdate({ name: option.label, value, grades }, i);
                }}
                isClearable
              />
            </Box>
            <Box w={24}>
              <Select
                size="sm"
                placeholder=""
                components={components}
                value={{
                  label: condition.value.toString(),
                  value: condition.value.toString(),
                  grades: new Set(
                    Object.keys(
                      conditionInfos[condition.name][condition.value],
                    ),
                  ),
                }}
                options={Object.entries(conditionInfos[condition.name]).map(
                  ([value, infosByValue]) => ({
                    label: value,
                    value,
                    grades: new Set(Object.keys(infosByValue)),
                  }),
                )}
                onChange={(option) => {
                  if (!onUpdate || !option) return;
                  const infosByName = conditionInfos[condition.name];
                  const value = Number(option.value);
                  const grades = new Set(Object.keys(infosByName[value]));

                  onUpdate({ name: condition.name, value, grades }, i);
                }}
              />
              <Text pl={4} pt={1} fontSize="small">
                이상
              </Text>
            </Box>
          </Flex>
        ))}
        {(conditions?.length ?? 0) < MAX_POTENTIALS && (
          <Flex gap={2}>
            <Box flex={1}>
              <Select
                size="sm"
                components={components}
                options={selectOptions}
                isOptionDisabled={(option) =>
                  (conditions ?? []).some(({ name }) => name == option.label)
                }
                onChange={(option) => {
                  if (!onCreate || !option) return;
                  const infosByName = conditionInfos[option.label];
                  const value = Number(Object.keys(infosByName)[0]);
                  const grades = new Set(Object.keys(infosByName[value]));

                  onCreate({ name: option.label, value, grades });
                }}
              />
            </Box>
            <Box w={24}>
              <Select size="sm" placeholder="" components={components} />
            </Box>
          </Flex>
        )}
      </Stack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text>자동설정</Text>
          <Text pt={2} fontSize="sm" fontWeight="normal">
            지정한 옵션세트 중 하나라도 충족 할 때까지 자동으로 재설정합니다.
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {conditionGrid.map((set, i) => (
            <Row
              key={"conditions-" + i}
              title={"옵션세트 " + (i + 1)}
              set={set}
              onCreate={(newCondition) => onChange(newCondition, i)}
              onUpdate={(newCondition, setIndex) =>
                onChange(newCondition, i, setIndex)
              }
              onDelete={(optionIndex) => onChange(undefined, i, optionIndex)}
              onGrade={(targetGrade) => onGradeChange(i, targetGrade)}
            />
          ))}
          <Row
            title={"옵션세트 추가"}
            onCreate={(newCondition) => onChange(newCondition)}
            onGrade={(targetGrade) => onGradeChange(undefined, targetGrade)}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function convertConditionInfosToSelectOptions(
  conditionInfos: ConditionInfos,
): Option[] {
  return Object.entries(conditionInfos).map(([name, infosByName]) => ({
    label: name,
    value: name,
    grades: Object.values(infosByName).reduce<Set<string>>(
      (acc, infosByValue) => {
        Object.keys(infosByValue).forEach((grade) => acc.add(grade));
        return acc;
      },
      new Set<string>(),
    ),
  }));
}

function isGradeLessOrEqualThan(grade: POTENTIAL_GRADE, compareGrade: string) {
  const parsedCompareGrade = parseGrade(compareGrade);
  if (!parsedCompareGrade) return false;

  const index = Object.values(POTENTIAL_GRADE).indexOf(grade);
  const compareIndex =
    Object.values(POTENTIAL_GRADE).indexOf(parsedCompareGrade);

  return index <= compareIndex;
}

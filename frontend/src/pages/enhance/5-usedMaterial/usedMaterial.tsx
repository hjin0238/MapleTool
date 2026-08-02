import {
  Flex,
  Image,
  Stack,
  Tag,
  Text,
  Tooltip,
  useColorMode,
} from "@chakra-ui/react";
import { useAppDispatch, useAppSelector } from "../../../stores/hooks";
import { AnimatedCounter } from "react-animated-counter";
import DeleteButton from "../../../components/action/deleteButton";
import { getMaterialIcon } from "../../../utils/icon";
import { deleteMaterial } from "../../../stores/userSlice";
import RequiredText from "../../../components/content/requiredText";
import {
  POTENTIAL_GRADE,
  POTENTIAL_INFOS,
} from "../../../constants/enhance/potential";

export default function UsedMaterial({
  inventoryIndex,
}: {
  inventoryIndex: number;
}) {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((state) => state.user.inventory);
  const enhancedItem = inventory[inventoryIndex];

  const dark = useColorMode().colorMode == "dark";
  const color = dark ? "white" : "black";

  if (inventoryIndex < 0 || inventoryIndex >= inventory.length) {
    return (
      <Flex justify="center" pt="1px">
        <RequiredText>장비를 선택해주세요.</RequiredText>
      </Flex>
    );
  }

  const rollCounts = enhancedItem.rollCounts ?? {};
  const hasRollCounts = Object.values(rollCounts).some(
    (count) => (count ?? 0) > 0,
  );

  if (!enhancedItem.used.length && !hasRollCounts) {
    return (
      <Flex justify="center" pt="1px">
        <RequiredText>사용한 재료가 없습니다.</RequiredText>
      </Flex>
    );
  }

  return (
    <Stack pt={2}>
      {hasRollCounts && (
        <Flex gap={3} wrap="wrap">
          {Object.values(POTENTIAL_GRADE).map(
            (g) =>
              (rollCounts[g] ?? 0) > 0 && (
                <Text key={"roll-count-" + g} fontSize="sm">
                  {POTENTIAL_INFOS[g].name}: {rollCounts[g]}회
                </Text>
              ),
          )}
        </Flex>
      )}
      <Flex gap={2} justify={{ base: "center", md: "start" }} wrap="wrap">
        {enhancedItem.used.map(({ name, value }) => (
          <Tooltip key={"material-" + name} label={name}>
            <Tag position="relative" pt={2} pb={1}>
              <Stack align="center">
                <Flex position="relative" h={8} justify="center" align="end">
                  <Image src={getMaterialIcon(name)} />
                  {name.startsWith("메소") && (
                    <Image
                      h={4}
                      src={getMaterialIcon(name.replace("메소 - ", ""))}
                    />
                  )}
                </Flex>
                <AnimatedCounter
                  includeDecimals={false}
                  includeCommas
                  fontSize="12px"
                  decrementColor={color}
                  incrementColor={color}
                  color={color}
                  value={value}
                  containerStyles={{ paddingBottom: "1px" }}
                />
              </Stack>
              <DeleteButton
                onClick={() =>
                  dispatch(deleteMaterial({ index: inventoryIndex, name }))
                }
              />
            </Tag>
          </Tooltip>
        ))}
      </Flex>
    </Stack>
  );
}

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Category } from '@/types';
import { CATEGORY_INFO } from '@/utils/categories';

interface Props {
  category: Category;
  size?: number;
  iconSize?: number;
}

export function CategoryIcon({ category, size = 40, iconSize = 18 }: Props) {
  const info = CATEGORY_INFO[category];
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: info.color + '20' },
      ]}
    >
      <Feather name={info.icon as any} size={iconSize} color={info.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});

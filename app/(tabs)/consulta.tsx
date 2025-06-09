import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function Consulta() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [registros, setRegistros] = useState<any[]>([]); // vai armazenar os dados lidos
    
    const [anoSelecionado, setAnoSelecionado] = useState<string | null>(null);
    const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);

    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');

    const flatListRef = useRef<FlatList>(null);

        useEffect(() => {
            carregarRegistros();
        }, [selectedDate]);

        const carregarRegistros = async () => {
            try {
            const todasChaves = await AsyncStorage.getAllKeys();
            const chavePrefixo = `registro_${formatDate(selectedDate)}`;
            const chavesDoDia = todasChaves.filter((chave) =>
                chave.startsWith(chavePrefixo)
            );

            const dados = await AsyncStorage.multiGet(chavesDoDia);
            const registrosFormatados = dados.map(([_, valor]) => JSON.parse(valor ?? '{}'));

            setRegistros(registrosFormatados);
            } catch (error) {
            console.error('Erro ao carregar registros:', error);
            }
        };
    
const limparRegistrosDoDia = async () => {
  try {
    const todasChaves = await AsyncStorage.getAllKeys();
    const chavePrefixo = `registro_${formatDate(selectedDate)}`;
    const chavesDoDia = todasChaves.filter((chave) =>
      chave.startsWith(chavePrefixo)
    );

    if (chavesDoDia.length > 0) {
      await AsyncStorage.multiRemove(chavesDoDia);
      setRegistros([]); // limpar visualmente
    }
  } catch (error) {
    console.error('Erro ao limpar registros:', error);
  }
};


    return(
        <View style={styles.container}>
            <Text style={styles.title}>Frequências Registradas</Text>
            <View style={styles.content}>
                {/* data */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateText}>Data: {formatDate(selectedDate)}</Text>
                    </TouchableOpacity>

                    <Text style={styles.dateText}>Registros: {registros.length}</Text>
                    
                </View>

                {showDatePicker && (
                    <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) setSelectedDate(date);
                    }}

                    />
                )}

                {/* Lista */}
                <FlatList
                    ref={flatListRef}
                    data={registros}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                    <View style={styles.item}>
                        <View style={styles.itemLeft}>
                            <Text style={styles.itemText}>Ano: {item.ano}</Text>
                            <Text style={styles.itemText}>Turma: {item.turma}</Text>
                        </View>
                        <View style={styles.itemRight}>
                            <Text style={styles.itemText}>Presença: {item.totalPresentes}</Text>
                            <Text style={styles.itemText}>Falta: {item.totalFaltas}</Text>
                        </View>
                    </View>

                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Nenhum registro encontrado para esta data.</Text>}
                    contentContainerStyle={{ paddingBottom: 100 }} // espaço para o botão
                />
            </View>

            <TouchableOpacity style={styles.clearButton} onPress={limparRegistrosDoDia}>
                <Text style={styles.clearButtonText}>Limpar registros do dia</Text>
            </TouchableOpacity>

        </View>
    )
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: '#eef5ff',
    padding: 16,
    paddingBottom: 80,
  },
  title:{
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#003B73',
  },
  dateText: {
    fontSize: 16,
    color: '#003B73',
    textAlign: 'center',
    marginBottom: 10,
  },
  item: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    },
    itemText: {
    fontSize: 16,
    color: '#003B73',
    },
    itemLeft: {
        flexDirection: 'column',
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    clearButton: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#FF5C5C',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },


});
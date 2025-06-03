import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Toast from 'react-native-toast-message';


/* ───────── Types ───────── */
type Presenca = 'P' | 'F' | 'FJ';
interface Student {
  id: string;
  name: string;
  presence: Presenca;
}


export default function Frequencia() {
  /* state */
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [anoSelecionado, setAnoSelecionado] = useState<string | null>(null);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [openAno, setOpenAno] = useState(false);
  const [openTurma, setOpenTurma] = useState(false);

  const presenceOptions: Presenca[] = ['P', 'F', 'FJ'];
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  
  const [turmas, setTurmas] = useState<Record<string, Record<string, string[]>> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  
const carregarTurmas = async (forcarAtualizacao = false) => {
  try {
    if (!forcarAtualizacao) {
      const cache = await AsyncStorage.getItem('turmas_cache');
      if (cache) {
        setTurmas(JSON.parse(cache));
        return;
      }
    }

    const res = await fetch('https://script.google.com/macros/s/AKfycbzSrdV8olN0RuoVMXWTn5_qaSZVfiqg_MAHEJxkmHFwTrhvpj3a9PRGlAt7d7tu4v1xYg/exec');
    const json = await res.json();
    setTurmas(json);
    await AsyncStorage.setItem('turmas_cache', JSON.stringify(json));
  } catch (err) {
    console.error('Não foi possível carregar turmas:', err);
  }
};


    useEffect(() => {
      carregarTurmas();
    }, []);


  /*Consultas basicas exemplo*/
  const [anoItems, setAnoItems] = useState<{ label: string; value: string }[]>([]);
  const [turmaItems, setTurmaItems] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (!turmas) return;
    //console.log("TURMAS CARREGADAS:", turmas);
    
    const anos = Object.keys(turmas)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((ano) => ({ label: ano, value: ano }));
    setAnoItems(anos);
  }, [turmas]);

  useEffect(() => {
    if (!turmas || !anoSelecionado) return;

    const turmasDoAno = Object.keys(turmas[anoSelecionado])
      .sort() // ordena corretamente (A, B, C, ..., J)
      .map((turma) => ({
        label: turma,
        value: turma,
      }));

    //console.log('TURMAS DO ANO', turmasDoAno); // 🧪 debug
    setTurmaItems(turmasDoAno);
  }, [turmas, anoSelecionado]);




    /* update list */
  useEffect(() => {
    // se ainda não carregou as turmas, ou não selecionou ano/turma, limpa a lista
    if (!turmas || !anoSelecionado || !turmaSelecionada) {
      setStudents([]);
      return;
    }

    // pega o array de nomes vindo do Google Sheets
    const nomesDaPlanilha =
      turmas[anoSelecionado]?.[turmaSelecionada] ?? [];

    // mapeia para o formato Student
    const lista: Student[] = nomesDaPlanilha.map((n, i) => ({
      id: `${anoSelecionado}-${turmaSelecionada}-${i}`,
      name: n,
      presence: 'P',
    }));

    setStudents(lista);
  }, [turmas, anoSelecionado, turmaSelecionada]);


  /* helpers */
  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');

  
  const handleRegistrar = async () => {
  if (!anoSelecionado || !turmaSelecionada) {
    alert('Selecione o ano e a turma antes de registrar.');
    return;
  }

  const chaveRegistro = `registro_${formatDate(selectedDate)}_${anoSelecionado}_${turmaSelecionada}`;

  try {
    const registroExistente = await AsyncStorage.getItem(chaveRegistro);
    if (registroExistente) {
      alert(`Esta turma já foi registrada na data ${formatDate(selectedDate)}.`);
      return;
    }
  } catch (err) {
    console.error('Erro ao verificar registro anterior:', err);
    alert('Erro ao verificar registro anterior.');
    return;
  }

  setIsSaving(true); // começa o loading

  const totalPresentes = students.filter((aluno) => aluno.presence === 'P').length;
  const totalFaltas = students.length - totalPresentes;

  const payload = {
    date: formatDate(selectedDate),
    ano: anoSelecionado,
    turma: turmaSelecionada,
    students: students.map((s) => ({
      name: s.name,
      presence: s.presence
    })),
  };

  try {
    const response = await fetch(
      //'https://script.google.com/macros/s/AKfycbxVwCWmJLDW1GEWFmAEqLxImH8M8M5ILTApTPPMCqcalD-eOcNiGpM51AbdgeVAxZAm_g/exec', //gestão
      'https://script.google.com/macros/s/AKfycbzWZUt8pju_Xs5_VEsgBx1rXfmvaFCxbSzjJrPeN3rzpRXCVj_b0T0Q0y1Z-ANwL_HARQ/exec', //professor
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();
    if (text === 'OK') {
      // ✅ Salvar marcação no AsyncStorage
      await AsyncStorage.setItem(
        chaveRegistro,
        JSON.stringify({
          registrado: true,
          data: formatDate(selectedDate),
          ano: anoSelecionado,
          turma: turmaSelecionada,
        })
      );

      Toast.show({
        type: 'success',
        text1: 'Frequência registrada!',
        text2: `Total de ausências: ${totalFaltas}`,
        position: 'top',
      });
    } else {
      alert(`Erro ao salvar: ${text}`);
    }
  } catch (err) {
    alert('Erro ao registrar presença');
    console.error(err);
  } finally {
    setIsSaving(false); // termina o loading
  }
};



const flatListRef = useRef<FlatList>(null);


  if (!turmas) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Carregando turmas...</Text>
      </View>
    );
  }


  /* render */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Presença</Text>

      {/* data */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>Data: {formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>Alunos: {students.length}</Text>
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

      {/* ano / turma */}
      <View style={styles.anoTurmaRow}>
        <View style={{ flex: 1 }}>
          <DropDownPicker
            open={openAno}
            value={anoSelecionado}
            items={anoItems}
            setOpen={setOpenAno}
            setValue={setAnoSelecionado}
            setItems={setAnoItems}
            placeholder="Ano"
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>
        <View style={{ flex: 1 }}>
          <DropDownPicker
            listMode="SCROLLVIEW"
            open={openTurma}
            value={turmaSelecionada}
            items={turmaItems}
            setOpen={setOpenTurma}
            setValue={setTurmaSelecionada}
            setItems={setTurmaItems}
            placeholder="Turma"
            zIndex={5000}
            zIndexInverse={1000}
            style={{ minHeight: 50 }}
            dropDownContainerStyle={{
              maxHeight: 400, // ajuste conforme necessário
            }}
            
          />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 200 }} // Espaço extra para o último dropdown
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => {
          const items = presenceOptions.map((p) => ({ label: p, value: p }));
          const isOpen = openIndex === item.id;
          const lineZ = students.length - index;

          return (
            <View
              style={[
                styles.studentRow,
                {
                  zIndex: lineZ,
                  elevation: lineZ, // para Android
                  position: 'relative',
                },
              ]}
            >
              <Text style={styles.studentName}>{item.name}</Text>

              <View style={styles.dropdownWrapper}>
                <DropDownPicker
                  open={isOpen}
                  value={item.presence}
                  items={items}
                  setOpen={() => {
                    if (openIndex !== item.id) {
                      setOpenIndex(item.id);

                      setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index, animated: true });
                      }, 200);
                    } else {
                      setOpenIndex(null);
                    }
                  }}

                  setValue={(cb) => {
                    const newVal = cb(item.presence);
                    setStudents((prev) =>
                      prev.map((st) =>
                        st.id === item.id ? { ...st, presence: newVal } : st
                      )
                    );
                  }}
                  setItems={() => {}}
                  style={[
                    styles.dropdown,
                    item.presence === 'P'
                      ? { backgroundColor: '#d4edda', borderColor: '#28a745' }
                      : item.presence === 'F'
                      ? { backgroundColor: '#f8d7da', borderColor: '#dc3545' }
                      : { backgroundColor: '#fff3cd', borderColor: '#fd7e14' },
                  ]}
                  dropDownContainerStyle={[
                    styles.dropdownMenu,
                    { zIndex: lineZ, elevation: lineZ },
                  ]}
                  zIndex={lineZ}
                  //zIndexInverse={false}
                  listMode="SCROLLVIEW"
                />
              </View>
            </View>
          );
        }}
      />


      {/* botão */}
      
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.footerBtn, isSaving && { opacity: 0.5 }]}
          onPress={handleRegistrar}
          disabled={isSaving}
        >
          <Text style={styles.footerBtnText}>
            {isSaving ? 'Salvando...' : 'Registrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, styles.atualizarBtn]}
          onPress={async () => {
            setIsUpdating(true);
            await AsyncStorage.removeItem('turmas_cache');
            await carregarTurmas(true);
            setIsUpdating(false);
            Toast.show({
              type: 'success',
              text1: 'Cache limpo e turmas atualizadas!',
              position: 'top',
            });
          }}
        >
          <Text style={styles.footerBtnText}>
            {isUpdating ? 'Atualizando...' : '🔄 Atualizar'}
          </Text>

        </TouchableOpacity>
      </View>

    </View>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef5ff',
    padding: 16,
    paddingBottom: 80,
  },
  title: {
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
  anoTurmaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    zIndex: 4000,
  },

  /* linha */
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  studentName: {
    flex: 1,
    fontSize: 16,
    color: '#003B73',
    marginRight: 8,
  },

  /* contêiner fixo */
  dropdownWrapper: {
    width: 90,
  },
  dropdown: {
    borderColor: '#003B73',
    backgroundColor: '#fff',
  },
  dropdownMenu: {
    borderColor: '#003B73',
    backgroundColor: '#fff',
  },
  separator: { height: 8 },

  registrarBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  registrarBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerRow: {
  position: 'absolute',
  bottom: 20,
  left: 20,
  right: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 10, // ou use marginRight no primeiro botão se necessário
},

footerBtn: {
  flex: 1,
  backgroundColor: '#007bff',
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
},

atualizarBtn: {
  backgroundColor: '#6c757d',
  marginLeft: 10,
},

footerBtnText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},
  
});
